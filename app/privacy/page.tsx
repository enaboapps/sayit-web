'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-black mb-6">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none text-black">
            <p className="text-black mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">1. Introduction</h2>
            <p className="text-black">
              Welcome to SayIt! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our communication application service. 
              Please read this Privacy Policy carefully. By accessing or using the Service, you agree to the collection and use of information in accordance with this policy.
            </p>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-black">We collect several types of information for various purposes to provide and improve our Service to you:</p>
            <ul className="list-disc ml-6 my-4 text-black">
              <li><strong>Personal Data:</strong> We may ask you to provide certain personally identifiable information when you register or use our Service, including but not limited to your email address and account details.</li>
              <li><strong>Usage Data:</strong> We may collect information on how the Service is accessed and used, including the pages you visit, features you use, and other diagnostic data.</li>
              <li><strong>Voice and Speech Data:</strong> When you use our text-to-speech features, we may process audio data to provide this functionality.</li>
              <li><strong>User-Generated Content:</strong> We store phrases, boards, and other content you create while using the Service.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-black">We use the collected data for various purposes:</p>
            <ul className="list-disc ml-6 my-4 text-black">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
              <li>To process payments and manage your subscription</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">4. Data Storage and Security</h2>
            <p className="text-black">
              The security of your data is important to us. We strive to use commercially acceptable means to protect your Personal Data. 
              Your information is stored securely in our database and is only accessible to authorized personnel. 
              However, no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">5. Service Providers</h2>
            <p className="text-black">
              We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, 
              perform Service-related services, or assist us in analyzing how our Service is used. These third parties have access 
              to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">6. Children's Privacy</h2>
            <p className="text-black">
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information 
              from children under 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, 
              please contact us so that we can take necessary actions.
            </p>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">7. Changes to This Privacy Policy</h2>
            <p className="text-black">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
              and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
            
            <h2 className="text-xl font-semibold text-black mt-8 mb-4">8. Contact Us</h2>
            <p className="text-black">
              If you have any questions about this Privacy Policy, please contact us at enaboapps@gmail.com.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 