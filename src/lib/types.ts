import type { User } from 'firebase/auth';

export interface AuthUser extends User {
  channel?: Channel;
}

export type Channel = {
  id: string;
  handle: string;
  fullName: string;
  bio: string;
  photoURL: string;
  bannerUrl?: string;
  subscribers: number;
  videoCount?: number;
};

export type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  channel: Channel;
  views: number;
  createdAt: Date;
  duration: number; // in seconds
  videoUrl: string;
  description: string;
  type: 'video' | 'short';
};

export type Comment = {
  id:string;
  user: {
    name: string;
    avatar: string;
  },
  text: string;
  timestamp: Date;
}
