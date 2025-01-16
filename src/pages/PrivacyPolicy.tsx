import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <h2>Introduction</h2>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>JEGantic ("we," "our," or "us") operates the JEGantic Hospitality Desk application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>

          <h2>Information Collection and Use</h2>
          <p>We collect several different types of information for various purposes to provide and improve our Service to you:</p>
          <ul>
            <li>Google Business Profile data for managing your business reviews</li>
            <li>Authentication information when you log in</li>
            <li>Business information you provide</li>
          </ul>

          <h2>Google Authentication</h2>
          <p>We use Google OAuth 2.0 for authentication and to access Google Business Profile API. This requires access to:</p>
          <ul>
            <li>Your email address</li>
            <li>Basic profile information</li>
            <li>Google Business Profile management permissions</li>
          </ul>

          <h2>Data Storage</h2>
          <p>Your data is securely stored using Supabase, our database provider. We implement appropriate data collection, storage, and processing practices to protect against unauthorized access, alteration, disclosure, or destruction of your information.</p>

          <h2>Use of Data</h2>
          <p>JEGantic uses the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To provide customer support</li>
            <li>To monitor the usage of our Service</li>
          </ul>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <ul>
            <li>Email: juan@jegantic.com</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;