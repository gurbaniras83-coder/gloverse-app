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
  createdAt?: string; // ISO String
  deviceId?: string;
  email?: string;
  phoneNumber?: string;
  isMonetized?: boolean;
  walletBalance?: number;
};

export type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channel?: Channel; // populated client-side
  views: number;
  createdAt: Date;
  duration: number; // in seconds
  videoUrl: string;
  description: string;
  type: 'long' | 'short';
  visibility: 'public' | 'private';
  likes: number;
  category?: string;
};

export type Comment = {
  id:string;
  user: {
    name: string;
    avatar: string;
    uid: string;
  },
  text: string;
  timestamp: Date;
}

    