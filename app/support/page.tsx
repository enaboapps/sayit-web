'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SupportPage() {
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
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h1 className="text-3xl font-bold text-black mb-6">Support</h1>
          
          <div>
            <h2 className="text-xl font-semibold text-black mb-4">Contact Us</h2>
            <p className="text-black mb-4">
              Have questions or need help with SayIt!? We're here to help!
            </p>
            <p className="text-black mb-6">
              Email: <a href="mailto:enaboapps@gmail.com" className="text-black hover:underline">enaboapps@gmail.com</a>
            </p>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-black mb-4">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-black hover:underline">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-black mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">How do I create a phrase board?</h3>
              <p className="text-black">
                You can create a new board by clicking the "New Board" button at the bottom of the screen 
                when viewing your phrases. Give your board a name and optionally add some phrases to get started.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">Can I use SayIt! offline?</h3>
              <p className="text-black">
                Yes! SayIt! is designed as a Progressive Web App (PWA), which means you can install it on your 
                device and use many features offline. Some features like account management and syncing require 
                an internet connection.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">How do I customize the voice settings?</h3>
              <p className="text-black">
                Go to the Settings page by clicking the gear icon in the sidebar. There you can adjust the 
                speech rate, pitch, volume, and select from available voices on your device.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">What is included in the Pro subscription?</h3>
              <p className="text-black">
                The Pro subscription gives you access to premium features like AI-powered phrase generation, 
                unlimited phrase boards, and priority support.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">How do I cancel my subscription?</h3>
              <p className="text-black">
                Go to the Account page and click "Manage Subscription." From there, you can update your 
                billing information or cancel your subscription.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 