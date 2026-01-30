export default function PrivacyPage() {
  return (
    <div className="space-y-6 text-foreground">
      <h1 className="text-3xl font-bold font-headline mb-4">Privacy Policy for GloVerse</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          GloVerse ("us", "we", or "our") operates the GloVerse mobile application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">Information Collection and Use</h2>
        <p>
          We collect several different types of information for various purposes to provide and improve our Service to you. This includes your email, name, and user-generated content like videos and comments.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">Service Providers</h2>
        <p>
          We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services, or to assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
        </p>
        <ul className="list-disc list-inside space-y-2 pl-4">
          <li>
            <strong>Firebase:</strong> We use Google's Firebase platform for backend services, including authentication, database (Firestore), and hosting. Firebase helps us build and manage the app infrastructure securely and efficiently.
          </li>
          <li>
            <strong>Google AdMob:</strong> We use Google AdMob to display advertisements within the app. AdMob may collect and use data to provide personalized ads. You can learn more about how Google collects and uses data by visiting Google's Privacy & Terms page.
          </li>
          <li>
            <strong>Cloudinary:</strong> We use Cloudinary for storing, managing, and delivering media content such as videos and images that you upload to the platform.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-foreground pt-4">Advertising</h2>
        <p>
          We partner with Google AdMob to serve ads. AdMob uses technology to show ads that are relevant to you. This may involve collecting information about your device and app usage.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us.
        </p>
      </div>
    </div>
  );
}
