# **App Name**: Gloverse

## Core Features:

- Unique Username Signup: Instagram-style signup with real-time Firestore handle check, password confirmation, full name, and bio.  Uses ghost email handle@gloverse.com. Auto-creates channel document in Firestore with handle, name, subscribers (default 0), and user_id.
- Home Feed: Single column vertical scroll of videos with large 16:9 thumbnails.
- Watch Page: Fixed top video player (16:9). Like (color toggle), Subscribe (Text: 'Subscribed' + Bell icon), and real-time Comments.
- Shorts Feed: Full-screen vertical snapping, auto-play. Tap to unmute sound.
- Professional Video Upload System: Upload system accessible via (+) menu for 'Short' or 'Video'.  Publish screen: Video Preview, Thumbnail Picker, Title, and Description. Auto-Thumbnail capture. Real-time progress bar during Firebase Storage upload.
- Gloverse Studio & Analytics Dashboard: Dashboard for creators with Monetization meter (300 Subscribers and 500 Watch Hours). Analytics with real-time view count.

## Style Guidelines:

- Background color: Dark mode with a near-black background (#0F0F0F), providing a high contrast and immersive viewing experience.
- Primary color: Use a vibrant orange (#FF8A65) for interactive elements to create an engaging platform. #FF8A65 provides a friendly and dynamic interface.
- Accent color: A lighter orange (#FFD54F) is to highlight the secondary interface elements.
- Font pairing: Use 'Space Grotesk' (sans-serif) for headlines to create a bold and tech-friendly platform with 'Inter' (sans-serif) for body.
- Simple, outlined icons for navigation and actions. Use the Tabler icon set or similar for consistency.
- Mobile-first, single-column layout optimized for screens up to 500px width. Center content with mx-auto for larger screens.
- Subtle transitions and animations for likes, subscriptions, and comment interactions to enhance user feedback.