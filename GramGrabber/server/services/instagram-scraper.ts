import { IgApiClient } from 'instagram-private-api';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface InstagramProfile {
  username: string;
  displayName: string;
  profilePicUrl: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'story';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  timestamp: Date;
  filename: string;
}

export class InstagramScraper {
  private ig: IgApiClient;
  
  constructor() {
    this.ig = new IgApiClient();
  }

  async getProfileInfo(profileUrl: string): Promise<InstagramProfile> {
    try {
      const username = this.extractUsername(profileUrl);
      
      // Using public endpoints for profile info
      const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const userData = response.data.data.user;
      
      return {
        username: userData.username,
        displayName: userData.full_name || userData.username,
        profilePicUrl: userData.profile_pic_url_hd,
        postsCount: userData.edge_owner_to_timeline_media.count,
        followersCount: userData.edge_followed_by.count,
        followingCount: userData.edge_follow.count,
      };
    } catch (error) {
      throw new Error(`Failed to fetch profile info: ${error}`);
    }
  }

  async getMediaItems(profileUrl: string, contentType: string): Promise<MediaItem[]> {
    try {
      const username = this.extractUsername(profileUrl);
      const mediaItems: MediaItem[] = [];
      
      // Get posts
      if (contentType === 'all' || contentType === 'images' || contentType === 'videos') {
        const posts = await this.getPostsData(username);
        mediaItems.push(...posts);
      }
      
      // Stories are typically not accessible without authentication
      // For public profiles, we can't access stories
      if (contentType === 'stories') {
        console.warn('Stories are not available for public profiles without authentication');
      }
      
      return mediaItems;
    } catch (error) {
      throw new Error(`Failed to fetch media items: ${error}`);
    }
  }

  private async getPostsData(username: string): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const posts = response.data.data.user.edge_owner_to_timeline_media.edges;
      const mediaItems: MediaItem[] = [];

      for (const post of posts) {
        const node = post.node;
        const isVideo = node.__typename === 'GraphVideo';
        
        if (node.__typename === 'GraphSidecar') {
          // Multiple images/videos in one post
          for (const edge of node.edge_sidecar_to_children.edges) {
            const childNode = edge.node;
            const childIsVideo = childNode.__typename === 'GraphVideo';
            
            mediaItems.push({
              id: childNode.id,
              type: childIsVideo ? 'video' : 'image',
              url: childIsVideo ? childNode.video_url : childNode.display_url,
              thumbnailUrl: childNode.display_url,
              caption: node.edge_media_to_caption.edges[0]?.node.text,
              timestamp: new Date(node.taken_at_timestamp * 1000),
              filename: `${childNode.id}.${childIsVideo ? 'mp4' : 'jpg'}`,
            });
          }
        } else {
          mediaItems.push({
            id: node.id,
            type: isVideo ? 'video' : 'image',
            url: isVideo ? node.video_url : node.display_url,
            thumbnailUrl: node.display_url,
            caption: node.edge_media_to_caption.edges[0]?.node.text,
            timestamp: new Date(node.taken_at_timestamp * 1000),
            filename: `${node.id}.${isVideo ? 'mp4' : 'jpg'}`,
          });
        }
      }

      return mediaItems;
    } catch (error) {
      throw new Error(`Failed to fetch posts data: ${error}`);
    }
  }

  async downloadMedia(mediaItems: MediaItem[], quality: string, tempDir: string): Promise<string[]> {
    const downloadedPaths: string[] = [];
    
    for (const item of mediaItems) {
      try {
        const filePath = path.join(tempDir, item.type + 's', item.filename);
        
        // Create directory if it doesn't exist
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        
        // Download the media file
        const response = await axios.get(item.url, {
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        downloadedPaths.push(filePath);
      } catch (error) {
        console.error(`Failed to download media ${item.id}:`, error);
      }
    }
    
    return downloadedPaths;
  }

  private extractUsername(profileUrl: string): string {
    const match = profileUrl.match(/instagram\.com\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid Instagram profile URL');
    }
    return match[1];
  }
}
