import { Channel, Video, Comment } from "./types";
import { PlaceHolderImages } from "./placeholder-images";

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || "https://picsum.photos/seed/error/640/360";

export const mockChannels: Channel[] = [
  { id: "user1", handle: "codemaster", fullName: "Alex Doe", bio: "Building the future, one line of code at a time.", photoURL: "https://avatar.vercel.sh/codemaster.png", bannerUrl: "https://picsum.photos/seed/ch1-banner/1200/400", subscribers: 125000, videoCount: 2 },
  { id: "user2", handle: "designgal", fullName: "Brianna Smith", bio: "Pixel perfectionist & UX enthusiast.", photoURL: "https://avatar.vercel.sh/designgal.png", bannerUrl: "https://picsum.photos/seed/ch2-banner/1200/400", subscribers: 78000, videoCount: 1 },
  { id: "user3", handle: "travelvibes", fullName: "Chris Wanderer", bio: "Exploring the world and sharing my journey.", photoURL: "https://avatar.vercel.sh/travelvibes.png", bannerUrl: "https://picsum.photos/seed/ch3-banner/1200/400", subscribers: 2300, videoCount: 1 },
];

export const mockVideos: Video[] = [
  {
    id: "vid1",
    title: "Building a Next.js App in 10 Minutes",
    thumbnailUrl: findImage("vid1"),
    channel: mockChannels[0],
    views: 102345,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    duration: 620,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    description: "A deep dive into server components and a full tutorial on building a modern web app with Next.js.",
    type: 'video'
  },
  {
    id: "vid2",
    title: "UI/UX Design Principles for Developers",
    thumbnailUrl: findImage("vid2"),
    channel: mockChannels[1],
    views: 88765,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    duration: 1230,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    description: "Learn the fundamentals of UI/UX design to make your applications not only functional but also beautiful and intuitive.",
    type: 'video'
  },
  {
    id: "vid3",
    title: "My Trip to the Swiss Alps",
    thumbnailUrl: findImage("vid3"),
    channel: mockChannels[2],
    views: 5421,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    duration: 945,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    description: "A breathtaking journey through the mountains of Switzerland. Drone shots, hiking trails, and more!",
    type: 'video'
  },
  {
    id: "vid4",
    title: "The Perfect Steak: A Culinary Guide",
    thumbnailUrl: findImage("vid4"),
    channel: mockChannels[0],
    views: 205813,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    duration: 480,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    description: "Master the art of cooking the perfect steak every single time. We cover everything from cut selection to searing.",
    type: 'video'
  },
];

export const mockShorts: Video[] = [
    {
    id: "short1",
    title: "Funny Cat Moments",
    thumbnailUrl: findImage("short1"),
    channel: mockChannels[1],
    views: 1200000,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    duration: 45,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "Just my cat being a goofball #cats #funny #shorts",
    type: 'short',
  },
  {
    id: "short2",
    title: "NYC Timelapse",
    thumbnailUrl: findImage("short2"),
    channel: mockChannels[2],
    views: 2500000,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    duration: 59,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "The city that never sleeps. #nyc #timelapse #city",
    type: 'short',
  },
];

export const mockComments: Comment[] = [
    { id: "c1", user: { name: "David", avatar: "https://avatar.vercel.sh/david.png" }, text: "This was so helpful! Thank you!", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { id: "c2", user: { name: "Sarah", avatar: "https://avatar.vercel.sh/sarah.png" }, text: "Great video, I learned a lot.", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
    { id: "c3", user: { name: "Mike", avatar: "https://avatar.vercel.sh/mike.png" }, text: "Can you do a video on React hooks next?", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
]
