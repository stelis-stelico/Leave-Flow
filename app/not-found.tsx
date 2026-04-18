import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-[80px] text-green-200 leading-none mb-4">404</p>
        <h1 className="font-display text-2xl text-gray-900 mb-2">Page not found</h1>
        <p className="text-[13px] text-gray-400 mb-8">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/dashboard" className="btn-green">Back to dashboard</Link>
      </div>
    </div>
  );
}
