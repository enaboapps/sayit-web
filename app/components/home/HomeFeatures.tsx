import TypingArea from '@/app/components/TypingArea';
import { useTTS } from '@/lib/hooks/useTTS';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';

export default function HomeFeatures() {
  const tts = useTTS();
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <TypingArea initialText={''} tts={tts} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            SayIt! - Your Voice, Your Words
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            A simple, powerful way to communicate with pre-recorded phrases
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Easy to Use</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create and organize your phrases into boards for quick access
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Customizable</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add your own phrases and organize them however you like
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Accessible</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Designed to be accessible and easy to use for everyone
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={() => router.push('/sign-in')}
              size="lg"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/sign-up')}
              variant="outline"
              size="lg"
            >
              Sign Up
            </Button>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 