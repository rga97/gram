import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { validatePassword, requirePasswordSession } from "./middleware/password-protection";
import { InstagramScraper } from "./services/instagram-scraper";
import { ZipCreator } from "./services/zip-creator";
import { insertDownloadSessionSchema, instagramUrlSchema } from "@shared/schema";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  const instagramScraper = new InstagramScraper();
  const zipCreator = new ZipCreator();

  // Password validation endpoint
  app.post("/api/auth/validate", validatePassword, async (req, res) => {
    try {
      const token = Buffer.from("++++froyo").toString('base64');
      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Create download session
  app.post("/api/download/create", requirePasswordSession, async (req, res) => {
    try {
      const validatedData = insertDownloadSessionSchema.parse(req.body);
      
      // Validate Instagram URL
      instagramUrlSchema.parse(validatedData.instagramUrl);
      
      const session = await storage.createDownloadSession(validatedData);
      
      // Start processing in background
      processDownload(session.id, instagramScraper, zipCreator);
      
      res.json({ sessionId: session.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create download session" });
      }
    }
  });

  // Get session status
  app.get("/api/download/status/:sessionId", requirePasswordSession, async (req, res) => {
    try {
      const session = await storage.getDownloadSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session status" });
    }
  });

  // Download zip file
  app.get("/api/download/file/:sessionId", requirePasswordSession, async (req, res) => {
    try {
      const session = await storage.getDownloadSession(req.params.sessionId);
      if (!session || session.status !== 'completed' || !session.zipFilePath) {
        return res.status(404).json({ error: "Download not ready or not found" });
      }
      
      if (!fs.existsSync(session.zipFilePath)) {
        return res.status(404).json({ error: "File not found" });
      }
      
      const username = session.profileData?.username || 'profile';
      const filename = `instagram_${username}_${Date.now()}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(session.zipFilePath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        // Cleanup file after download
        fs.unlink(session.zipFilePath!, (err) => {
          if (err) console.error('Failed to cleanup zip file:', err);
        });
      });
      
    } catch (error) {
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processDownload(sessionId: string, scraper: InstagramScraper, zipCreator: ZipCreator) {
  try {
    const session = await storage.getDownloadSession(sessionId);
    if (!session) return;

    // Update status to processing
    await storage.updateDownloadSession(sessionId, {
      status: 'processing',
      progress: 10
    });

    // Get profile info
    const profileInfo = await scraper.getProfileInfo(session.instagramUrl);
    await storage.updateDownloadSession(sessionId, {
      profileData: profileInfo,
      progress: 25
    });

    // Get media items
    const mediaItems = await scraper.getMediaItems(session.instagramUrl, session.contentType);
    
    const mediaStats = {
      total: mediaItems.length,
      images: mediaItems.filter(item => item.type === 'image').length,
      videos: mediaItems.filter(item => item.type === 'video').length,
      stories: mediaItems.filter(item => item.type === 'story').length,
    };
    
    await storage.updateDownloadSession(sessionId, {
      mediaStats,
      progress: 50
    });

    // Create temp directory and download media
    const tempDir = zipCreator.createTempDirectory();
    await scraper.downloadMedia(mediaItems, session.quality, tempDir);
    
    await storage.updateDownloadSession(sessionId, { progress: 80 });

    // Create zip file
    const zipPath = path.join(tempDir, '..', `${sessionId}.zip`);
    await zipCreator.createZipArchive(tempDir, zipPath);
    
    // Cleanup temp directory
    await zipCreator.cleanup(tempDir);

    // Update session as completed
    await storage.updateDownloadSession(sessionId, {
      status: 'completed',
      progress: 100,
      zipFilePath: zipPath
    });

  } catch (error) {
    console.error('Download processing failed:', error);
    await storage.updateDownloadSession(sessionId, {
      status: 'failed',
      progress: 0
    });
  }
}
