import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-zinc-900">
      <Link
        href="/chat"
        className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        Chat
      </Link>
    </main>
  );
}
