import { SignIn } from '@clerk/nextjs';
import { clerkDarkAppearance } from '@/lib/clerkAppearance';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignIn appearance={clerkDarkAppearance} />
    </div>
  );
}
