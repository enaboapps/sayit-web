import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-6xl font-bold text-primary-500">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or you may not have access.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-3xl bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
      >
        Go home
      </Link>
    </div>
  );
}
