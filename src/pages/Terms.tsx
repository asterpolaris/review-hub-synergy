import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <h2>Introduction</h2>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>These Terms and Conditions ("Terms", "Terms and Conditions") govern your use of the JEGantic Hospitality Desk application operated by JEGantic ("we," "our," or "us").</p>
          
          <h2>Access and Use</h2>
          <p>By using our Service, you agree to these Terms. If you disagree with any part of the terms, you may not access the Service.</p>

          <h2>Account Terms</h2>
          <ul>
            <li>You must be invited to use this service by an administrator</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must not use the Service for any illegal purposes</li>
          </ul>

          <h2>Google Services Integration</h2>
          <p>Our Service integrates with Google Business Profile API. By using our Service, you also agree to:</p>
          <ul>
            <li>Google's Terms of Service</li>
            <li>Provide accurate information for Google authentication</li>
            <li>Not misuse or attempt to circumvent Google API restrictions</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>The Service and its original content, features, and functionality are owned by JEGantic and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

          <h2>Limitation of Liability</h2>
          <p>In no event shall JEGantic, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>

          <h2>Changes to Terms</h2>
          <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <ul>
            <li>Email: juan@jegantic.com</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;