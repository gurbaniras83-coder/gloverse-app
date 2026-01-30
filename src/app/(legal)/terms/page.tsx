export default function TermsPage() {
  return (
    <div className="space-y-6 text-foreground">
      <h1 className="text-3xl font-bold font-headline mb-4">Terms of Service for GloVerse</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the GloVerse application (the "Service") operated by GloVerse ("us", "we", or "our").
        </p>
        
        <h2 className="text-xl font-bold text-foreground pt-4">1. Accounts</h2>
        <p>
          When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">2. Content</h2>
        <p>
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness. By posting Content, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">3. Prohibited Uses</h2>
        <p>
          You agree not to use the Service for any purpose that is illegal or prohibited by these Terms. You are prohibited from violating or attempting to violate the security of the Service.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">4. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">5. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-xl font-bold text-foreground pt-4">Changes</h2>
        <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
        </p>
      </div>
    </div>
  );
}
