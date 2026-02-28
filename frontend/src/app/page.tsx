import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6">
        <img
          src="/illustrations/standing-2.svg"
          alt=""
          className="w-56 mx-auto mb-8 opacity-80"
        />
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-blue-500">LAND</span>
          <span className="text-gray-900">LY</span>
        </h1>
        <p className="text-sm uppercase tracking-wider text-gray-500">
          Modern Living, Simplified
        </p>
        <p className="text-gray-500 max-w-md mx-auto">
          Your AI-powered apartment management experience.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
