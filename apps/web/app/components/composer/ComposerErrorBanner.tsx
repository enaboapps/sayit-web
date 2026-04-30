'use client';

interface ComposerErrorBannerProps {
  error: string;
}

export default function ComposerErrorBanner({ error }: ComposerErrorBannerProps) {
  return (
    <div className="px-6 pb-2">
      <span className="text-sm text-red-400">{error}</span>
    </div>
  );
}
