import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-primary-light">LAND</span>LY
        </h1>
        <p className="label-tracked text-zinc-500">
          Citizen Housing Management Portal v2.4.1
        </p>
        <p className="text-zinc-400 max-w-md mx-auto">
          Your AI-powered apartment management experience.
          Compliance is comfort.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-8 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          Access Portal
        </Link>
      </div>
    </main>
  );
}
