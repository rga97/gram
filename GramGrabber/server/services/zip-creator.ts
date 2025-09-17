import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class ZipCreator {
  async createZipArchive(sourceDir: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add directories with proper structure
      const imagesDir = path.join(sourceDir, 'images');
      const videosDir = path.join(sourceDir, 'videos');
      const storiesDir = path.join(sourceDir, 'stories');

      if (fs.existsSync(imagesDir)) {
        archive.directory(imagesDir, 'images');
      }

      if (fs.existsSync(videosDir)) {
        archive.directory(videosDir, 'videos');
      }

      if (fs.existsSync(storiesDir)) {
        archive.directory(storiesDir, 'stories');
      }

      archive.finalize();
    });
  }

  async cleanup(dirPath: string): Promise<void> {
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup directory:', error);
    }
  }

  createTempDirectory(): string {
    const tempDir = path.join(process.cwd(), 'temp', randomUUID());
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }
}
