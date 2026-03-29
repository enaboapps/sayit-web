'use client';

import BackButton from '@/app/components/ui/BackButton';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-text-secondary mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}<br />
              <strong>Version:</strong> 2.0
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p className="text-text-secondary mb-4">
              Welcome to SayIt! ("we," "our," or "us"). SayIt! is an AI-powered augmentative and alternative communication (AAC) application designed to help users express their thoughts, feelings, needs, and wants more effectively.
            </p>
            <p className="text-text-secondary mb-4">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and services (collectively, the "Service"). Please read this Privacy Policy carefully.
            </p>
            <p className="text-text-secondary">
              By accessing or using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not use the Service.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">2.1 Personal Information</h3>
            <p className="text-text-secondary mb-2">When you create an account, we collect:</p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Email address:</strong> Used for account creation and communication</li>
              <li><strong>Name:</strong> Used for account personalization (optional)</li>
              <li><strong>Authentication credentials:</strong> Managed securely by Clerk</li>
              <li><strong>Payment information:</strong> Processed by Stripe (we do not store payment card details)</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">2.2 User-Generated Content</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Phrases and boards:</strong> Content you create and save in the application</li>
              <li><strong>Typing sessions:</strong> Shared typing sessions (when you use the sharing feature)</li>
              <li><strong>Completed message history:</strong> Recent completed messages captured for reply suggestions when enabled</li>
              <li><strong>User preferences:</strong> Text size, voice settings, and other customizations</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">2.3 Usage Data</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Application usage:</strong> Features used, pages visited, interaction patterns</li>
              <li><strong>Device information:</strong> Browser type, operating system, device type (for PWA functionality)</li>
              <li><strong>Performance data:</strong> Error logs, load times, service health metrics</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">2.4 AI Interaction Data</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Prompts sent to AI services:</strong> Text you submit for phrase generation or "Flesh Out" features</li>
              <li><strong>Reply suggestion prompts:</strong> Recent completed messages used to generate likely next replies</li>
              <li><strong>Generated content:</strong> AI-generated suggestions and expanded text</li>
              <li><strong>Text-to-speech requests:</strong> Text submitted for voice synthesis</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">2.5 Local Storage</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Browser local storage:</strong> Font size preferences, UI state, typing area visibility</li>
              <li><strong>PWA cache:</strong> Application resources for offline functionality</li>
              <li><strong>Session cookies:</strong> Authentication and session management</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Third-Party Service Providers</h2>
            <p className="text-text-secondary mb-4">
              We use the following third-party services to provide and improve our Service. Each service has its own privacy policy governing how they handle your data:
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.1 Clerk (Authentication & Billing)</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Purpose:</strong> User authentication, account management, and subscription billing</li>
              <li><strong>Data processed:</strong> Email, name, authentication credentials, subscription status</li>
              <li><strong>Privacy policy:</strong> <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">https://clerk.com/privacy</a></li>
              <li><strong>Location:</strong> United States</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.2 Convex (Database & Real-time Sync)</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Purpose:</strong> Store and sync user data, phrases, boards, typing sessions, and recent completed message history</li>
              <li><strong>Data processed:</strong> User profiles, phrases, boards, typing session content, recent completed messages for suggestions</li>
              <li><strong>Privacy policy:</strong> <a href="https://www.convex.dev/legal/privacy/v2024-03-21" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">https://www.convex.dev/legal/privacy</a></li>
              <li><strong>Location:</strong> United States</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.3 Stripe (Payment Processing)</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Purpose:</strong> Process subscription payments (integrated via Clerk Billing)</li>
              <li><strong>Data processed:</strong> Payment information, billing address, transaction history</li>
              <li><strong>Privacy policy:</strong> <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">https://stripe.com/privacy</a></li>
              <li><strong>Compliance:</strong> PCI DSS Level 1 certified</li>
              <li><strong>Note:</strong> We do not store payment card details; they are handled entirely by Stripe</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.4 OpenRouter (AI Processing)</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Purpose:</strong> Power AI features including phrase generation and "Flesh Out" functionality</li>
              <li><strong>Data processed:</strong> Text prompts you submit for AI processing, generated responses</li>
              <li><strong>Model used:</strong> Google Gemini 2.5 Flash (via OpenRouter)</li>
              <li><strong>Privacy policy:</strong> <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">https://openrouter.ai/privacy</a></li>
              <li><strong>Data retention:</strong> Requests are processed in real-time and not stored long-term</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.5 ElevenLabs (Text-to-Speech)</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Purpose:</strong> Provide high-quality voice synthesis for text-to-speech</li>
              <li><strong>Data processed:</strong> Text submitted for speech synthesis</li>
              <li><strong>Privacy policy:</strong> <a href="https://elevenlabs.io/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">https://elevenlabs.io/privacy-policy</a></li>
              <li><strong>Data retention:</strong> Real-time processing only, audio not stored</li>
              <li><strong>Fallback:</strong> If ElevenLabs is unavailable, we use your browser's built-in Web Speech API</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">3.6 Vercel (Hosting)</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Purpose:</strong> Application hosting and content delivery</li>
              <li><strong>Data processed:</strong> HTTP request logs, performance metrics</li>
              <li><strong>Privacy policy:</strong> <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">https://vercel.com/legal/privacy-policy</a></li>
              <li><strong>Location:</strong> Global CDN</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. How We Use Your Information</h2>
            <p className="text-text-secondary mb-2">We use the collected information for the following purposes:</p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Provide the Service:</strong> Create and manage your account, store your data, enable features</li>
              <li><strong>Process payments:</strong> Handle subscription billing and payment processing</li>
              <li><strong>AI features:</strong> Generate phrase suggestions and expand text using AI</li>
              <li><strong>Reply suggestions:</strong> Infer likely next replies from your recent completed messages</li>
              <li><strong>Text-to-speech:</strong> Convert text to spoken audio</li>
              <li><strong>Improve the Service:</strong> Analyze usage patterns, fix bugs, develop new features</li>
              <li><strong>Communicate:</strong> Send service updates, respond to support requests</li>
              <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security issues</li>
              <li><strong>Legal compliance:</strong> Comply with applicable laws and regulations</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Data Retention</h2>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Account data:</strong> Retained until you delete your account</li>
              <li><strong>Phrases and boards:</strong> Retained until you manually delete them</li>
              <li><strong>Typing sessions:</strong> Shared sessions expire after 24 hours of inactivity</li>
              <li><strong>Completed message history:</strong> Retained to power reply suggestions until deleted or trimmed by retention limits</li>
              <li><strong>AI processing data:</strong> Not retained after response generation (processed in real-time)</li>
              <li><strong>TTS audio:</strong> Not stored (generated in real-time)</li>
              <li><strong>Payment records:</strong> Retained per Stripe's requirements (up to 7 years for legal compliance)</li>
              <li><strong>Local storage:</strong> Stored on your device until you clear it</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Special Features</h2>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">6.1 Typing Share</h3>
            <p className="text-text-secondary mb-2">
              The Typing Share feature allows you to create shareable links for live typing sessions:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li>Anyone with the link can view your typing session in real-time</li>
              <li>Sessions expire 24 hours after the last activity</li>
              <li>You control when sharing starts and stops</li>
              <li>Share links at your own discretion and understand the privacy implications</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">6.2 Progressive Web App (PWA)</h3>
            <p className="text-text-secondary mb-2">
              SayIt! can be installed as a PWA for offline access:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li>Application resources are cached locally on your device</li>
              <li>Core text communication and browser speech can keep working offline after the app has been opened</li>
              <li>Your cloud-backed data syncs with our servers when you're online</li>
              <li>Some features require an internet connection (AI, ElevenLabs, boards, account sync)</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">6.3 AI-Powered Features</h3>
            <p className="text-text-secondary mb-2">
              By using AI features ("Flesh Out," phrase generation), you acknowledge:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li>Your prompts are sent to OpenRouter (using Google Gemini) for processing</li>
              <li>If reply suggestions are enabled, recent completed messages may be sent to OpenRouter to infer what you may want to say next</li>
              <li>Generated content is based on AI models and may vary</li>
              <li>You consent to AI processing when using these features</li>
              <li>We do not use your prompts to train AI models</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Your Rights and Choices</h2>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">7.1 Access and Control</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Access your data:</strong> View your profile, phrases, and boards within the application</li>
              <li><strong>Update information:</strong> Edit your profile and preferences in account settings</li>
              <li><strong>Delete content:</strong> Delete individual phrases and boards at any time</li>
              <li><strong>Delete account:</strong> Request account deletion via your Clerk user profile (permanently deletes all data)</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">7.2 Communication Preferences</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li>You can manage email preferences through Clerk account settings</li>
              <li>We only send service-related communications (no marketing emails)</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">7.3 Feature Control</h3>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>TTS service:</strong> Choose between ElevenLabs or browser Web Speech API</li>
              <li><strong>AI features:</strong> Optional features you can choose to use or not use</li>
              <li><strong>Sharing:</strong> Complete control over when and what you share</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Data Security</h2>
            <p className="text-text-secondary mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Encryption:</strong> Data transmitted over HTTPS, stored encrypted at rest</li>
              <li><strong>Access controls:</strong> Limited employee access to user data</li>
              <li><strong>Authentication:</strong> Secure authentication via Clerk</li>
              <li><strong>PCI compliance:</strong> Payment processing meets PCI DSS standards via Stripe</li>
              <li><strong>Regular updates:</strong> Security patches and updates applied promptly</li>
            </ul>
            <p className="text-text-secondary">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. International Data Transfers</h2>
            <p className="text-text-secondary mb-4">
              Our Service and third-party providers primarily operate in the United States. By using the Service, you consent to the transfer of your information to the United States and other countries where our service providers operate.
            </p>
            <p className="text-text-secondary">
              We ensure that all data transfers comply with applicable data protection laws, including GDPR requirements for EU users.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Children's Privacy</h2>
            <p className="text-text-secondary mb-4">
              Our Service does not specifically target children under 13. We do not knowingly collect personally identifiable information from children under 13 without parental consent.
            </p>
            <p className="text-text-secondary">
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately so we can delete such information.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">11. Your Privacy Rights</h2>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">11.1 GDPR Rights (EU Users)</h3>
            <p className="text-text-secondary mb-2">If you are located in the European Economic Area, you have the following rights:</p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Right to access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to rectification:</strong> Correct inaccurate data</li>
              <li><strong>Right to erasure:</strong> Request deletion of your data</li>
              <li><strong>Right to restriction:</strong> Limit how we use your data</li>
              <li><strong>Right to data portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to object:</strong> Object to certain data processing</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">11.2 CCPA Rights (California Users)</h3>
            <p className="text-text-secondary mb-2">If you are a California resident, you have the following rights:</p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Right to know:</strong> What personal information we collect and how it's used</li>
              <li><strong>Right to delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to opt-out:</strong> Opt-out of the sale of personal information (we do not sell personal information)</li>
              <li><strong>Right to non-discrimination:</strong> Not be discriminated against for exercising your rights</li>
            </ul>

            <p className="text-text-secondary mt-4">
              To exercise any of these rights, please contact us at <a href="mailto:enaboapps@gmail.com" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">enaboapps@gmail.com</a>.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">12. Cookies and Tracking</h2>
            <p className="text-text-secondary mb-4">
              We use cookies and similar tracking technologies for:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Authentication cookies:</strong> Maintain your logged-in session (via Clerk)</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Essential cookies:</strong> Required for the Service to function properly</li>
            </ul>
            <p className="text-text-secondary">
              We do not use advertising or tracking cookies. You can control cookies through your browser settings, but disabling essential cookies may prevent the Service from functioning properly.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-text-secondary mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.
            </p>
            <p className="text-text-secondary mb-4">
              When we make changes, we will:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li>Update the "Effective Date" at the top of this policy</li>
              <li>Notify you via email for material changes (if you have an account)</li>
              <li>Post a notice in the application</li>
            </ul>
            <p className="text-text-secondary">
              Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">14. Contact Us</h2>
            <p className="text-text-secondary mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-disc ml-6 my-4 text-text-secondary">
              <li><strong>Email:</strong> <a href="mailto:enaboapps@gmail.com" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">enaboapps@gmail.com</a></li>
              <li><strong>Subject line:</strong> "Privacy Policy Inquiry" or "Data Rights Request"</li>
            </ul>
            <p className="text-text-secondary">
              We will respond to your inquiry within 30 days.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
