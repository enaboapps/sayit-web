'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I get started with SayIt!?',
    answer: (
      <>
        Open <Link href="/try" className="text-primary-500 hover:text-primary-600 hover:underline">Try SayIt!</Link> to use <strong>Type</strong> and <strong>Speak</strong> without an account. Create an account or sign in when you want to save <strong>Boards</strong> and <strong>Phrases</strong>, sync communication settings, or use account features.
      </>
    ),
  },
  {
    question: 'How do I create and customize a Board?',
    answer: (
      <>
        Open <strong>Phrases</strong> and choose <strong>Add Board</strong>. On a Board, use <strong>Add Tile</strong> to add a Phrase, a link to another Board, or recorded audio. Open the Board options to rename or edit the Board, rearrange tiles, or import and export Board files.
      </>
    ),
  },
  {
    question: 'Can I use SayIt! offline?',
    answer: (
      <>
        Yes. After you open SayIt! online, signed-in Boards are prepared on that device for read-only offline use. <strong>Type</strong> and browser speech continue to work offline. <strong>Fix Text</strong>, reply suggestions, <strong>Live Typing</strong>, premium cloud voices, account changes, and cloud sync require an internet connection.
      </>
    ),
  },
  {
    question: 'How do I change the voice and speech settings?',
    answer: (
      <>
        Go to <strong>Settings</strong>, then open <strong>Voice &amp; Speech</strong>. You can choose an available voice and adjust speech rate, pitch, and volume. Browser voices are available without Pro; premium cloud voices require an active Pro subscription and an internet connection.
      </>
    ),
  },
  {
    question: 'What is included with SayIt! Pro?',
    answer: (
      <>
        Pro includes <strong>Fix Text</strong>, reply suggestions, premium cloud voices, and supporter tools for managing communicators and their Boards. Visit the <Link href="/pricing" className="text-primary-500 hover:text-primary-600 hover:underline">pricing page</Link> for the current plan and availability.
      </>
    ),
  },
  {
    question: 'How do I manage or cancel my subscription?',
    answer: (
      <>
        Go to <strong>Settings</strong>, open <strong>Account</strong>, and select your avatar to open the account controls. From there, you can manage billing details or cancel your subscription.
      </>
    ),
  },
  {
    question: 'How can a supporter manage a communicator’s Boards?',
    answer: (
      <>
        With Pro, a supporter can open <strong>Clients</strong>, send a connection request to a communicator, and create or assign Boards after the request is accepted. Each shared Board can be set to view-only or allow editing, and updates appear on the communicator’s devices.
      </>
    ),
  },
  {
    question: 'Can I import or export Boards?',
    answer: (
      <>
        Yes. Open the Board options in <strong>Phrases</strong> to import an Open Board file, export the current Board as an <code>.obf</code> file, or export all Boards as an <code>.obz</code> bundle. These formats can help move compatible AAC Boards between tools.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-8 mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-6">Support</h1>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-text-secondary mb-4">
              Have questions or need help with SayIt!? We're here to help!
            </p>
            <p className="text-text-secondary mb-6">
              Email: <a href="mailto:enaboapps@gmail.com" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">enaboapps@gmail.com</a>
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-primary-500 hover:text-primary-600 hover:underline transition-colors duration-200">
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
          className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group overflow-hidden rounded-[var(--radius-control)] border border-border bg-background shadow-[var(--shadow-control)]"
              >
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left text-base font-semibold text-foreground transition-colors duration-[var(--motion-duration-fast)] hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 [&::-webkit-details-marker]:hidden sm:px-5">
                  <span>{item.question}</span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-text-secondary transition-transform duration-[var(--motion-duration-fast)] group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-border px-4 py-4 text-sm leading-6 text-text-secondary sm:px-5 sm:text-base">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
