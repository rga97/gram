import { type DownloadSession, type InsertDownloadSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createDownloadSession(session: InsertDownloadSession): Promise<DownloadSession>;
  getDownloadSession(id: string): Promise<DownloadSession | undefined>;
  updateDownloadSession(id: string, updates: Partial<DownloadSession>): Promise<DownloadSession | undefined>;
  deleteExpiredSessions(): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, DownloadSession>;

  constructor() {
    this.sessions = new Map();
    
    // Clean up expired sessions every hour
    setInterval(() => {
      this.deleteExpiredSessions();
    }, 60 * 60 * 1000);
  }

  async createDownloadSession(insertSession: InsertDownloadSession): Promise<DownloadSession> {
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const session: DownloadSession = {
      id,
      instagramUrl: insertSession.instagramUrl,
      quality: insertSession.quality || "highest",
      contentType: insertSession.contentType || "all",
      status: "pending",
      progress: 0,
      profileData: null,
      mediaStats: null,
      zipFilePath: null,
      createdAt: now,
      expiresAt,
    };
    
    this.sessions.set(id, session);
    return session;
  }

  async getDownloadSession(id: string): Promise<DownloadSession | undefined> {
    return this.sessions.get(id);
  }

  async updateDownloadSession(id: string, updates: Partial<DownloadSession>): Promise<DownloadSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    const keysToDelete: string[] = [];
    
    this.sessions.forEach((session, id) => {
      if (session.expiresAt < now) {
        keysToDelete.push(id);
      }
    });
    
    keysToDelete.forEach(id => this.sessions.delete(id));
  }
}

export const storage = new MemStorage();
