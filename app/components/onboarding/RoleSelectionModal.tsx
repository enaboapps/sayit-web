'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserIcon, HeartIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleSelectionModalProps {
  onComplete: () => void;
  visible: boolean;
}

export default function RoleSelectionModal({ onComplete, visible }: RoleSelectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'caregiver' | 'communicator' | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [isMounted, setIsMounted] = useState(false);
  const setRole = useMutation(api.profiles.setRole);

  // Delay mounting to prevent flash
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsMounted(false);
    }
  }, [visible]);

  const handleContinue = () => {
    if (!selectedRole) return;
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('select');
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await setRole({ role: selectedRole });
      onComplete();
    } catch (err) {
      console.error('Failed to set role:', err);
      setIsSubmitting(false);
    }
  };

  const roleConfig = {
    communicator: {
      icon: UserIcon,
      title: 'Communicator',
      description: 'You will use boards and phrases to express yourself. You can create your own boards or receive boards from a caregiver.',
    },
    caregiver: {
      icon: HeartIcon,
      title: 'Caregiver',
      description: 'You will create and manage boards for your clients. You can share boards with configurable permissions.',
    },
  };

  // Confirmation step
  if (step === 'confirm' && selectedRole) {
    const config = roleConfig[selectedRole];
    const Icon = config.icon;

    return (
      <AnimatePresence>
        {visible && isMounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full p-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-full bg-primary-500/20 mb-4">
                  <Icon className="w-10 h-10 text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
              Continue as {config.title}?
                </h2>
                <p className="text-text-secondary">
                  {config.description}
                </p>
              </div>

              <div className="bg-surface-hover rounded-xl p-4 mb-8">
                <p className="text-text-secondary text-sm text-center">
              You can change your role later in settings, but switching roles may result in some data being removed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-4 bg-surface-hover hover:bg-background text-foreground font-semibold rounded-xl transition-colors"
                >
              Go Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Setting up...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Selection step
  return (
    <AnimatePresence>
      {visible && isMounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to SayIt!</h2>
              <p className="text-text-secondary">
            How will you be using the app?
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => setSelectedRole('communicator')}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-start gap-4 relative ${
                  selectedRole === 'communicator'
                    ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/50'
                    : 'border-border hover:border-primary-500/50 hover:bg-surface-hover'
                }`}
              >
                {selectedRole === 'communicator' && (
                  <CheckCircleIcon className="absolute top-4 right-4 w-6 h-6 text-primary-500" />
                )}
                <div className={`p-3 rounded-full flex-shrink-0 ${
                  selectedRole === 'communicator' ? 'bg-primary-500' : 'bg-surface-hover'
                }`}>
                  <UserIcon className={`w-6 h-6 ${
                    selectedRole === 'communicator' ? 'text-white' : 'text-text-secondary'
                  }`} />
                </div>
                <div className="pr-8">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    selectedRole === 'communicator' ? 'text-primary-400' : 'text-foreground'
                  }`}>
                I need help communicating
                  </h3>
                  <p className="text-text-secondary text-sm">
                Use boards and phrases to express yourself. You can create your own or receive boards from a caregiver.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('caregiver')}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-start gap-4 relative ${
                  selectedRole === 'caregiver'
                    ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/50'
                    : 'border-border hover:border-primary-500/50 hover:bg-surface-hover'
                }`}
              >
                {selectedRole === 'caregiver' && (
                  <CheckCircleIcon className="absolute top-4 right-4 w-6 h-6 text-primary-500" />
                )}
                <div className={`p-3 rounded-full flex-shrink-0 ${
                  selectedRole === 'caregiver' ? 'bg-primary-500' : 'bg-surface-hover'
                }`}>
                  <HeartIcon className={`w-6 h-6 ${
                    selectedRole === 'caregiver' ? 'text-white' : 'text-text-secondary'
                  }`} />
                </div>
                <div className="pr-8">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    selectedRole === 'caregiver' ? 'text-primary-400' : 'text-foreground'
                  }`}>
                I'm helping someone communicate
                  </h3>
                  <p className="text-text-secondary text-sm">
                Create and manage boards for your clients. Share boards with configurable permissions.
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedRole}
              className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
          Continue
            </button>

            <p className="text-text-tertiary text-xs text-center mt-4">
          You can change this later in settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
