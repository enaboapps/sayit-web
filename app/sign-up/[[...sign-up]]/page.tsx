import { SignUp } from '@clerk/nextjs';
import { clerkDarkAppearance } from '@/lib/clerkAppearance';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignUp appearance={clerkDarkAppearance} />
    </div>
  );
}
