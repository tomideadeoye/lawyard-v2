import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We couldn't find the page you're looking for.
      </p>
      <Link
        href="/"
        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
