import TypingArea from '@/app/components/TypingArea';

interface HomeFeaturesProps {
  typingText: string;
}

export default function HomeFeatures({ typingText }: HomeFeaturesProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none">
        <TypingArea initialText={typingText} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            SayIt! - Your Voice, Your Words
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A simple, powerful way to communicate with pre-recorded phrases
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-gray-600">
                Create and organize your phrases into boards for quick access
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customizable</h3>
              <p className="text-gray-600">
                Add your own phrases and organize them however you like
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Accessible</h3>
              <p className="text-gray-600">
                Designed to be accessible and easy to use for everyone
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 