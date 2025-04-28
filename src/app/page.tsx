"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [minPlayers, setMinPlayers] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setGameUrl("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          is_public: isPublic,
          max_players: maxPlayers,
          min_players: minPlayers,
          options: {}
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create game");
      setSuccess("Game created!");
      setGameUrl(`${window.location.origin}/game/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (gameUrl) navigator.clipboard.writeText(gameUrl);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <Button onClick={() => setOpen(true)} className="mb-4">New Game</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleCreateGame}>
              <label className="flex flex-col gap-1">
                Name
                <input
                  className="border rounded px-2 py-1"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={100}
                />
              </label>
              <label className="flex flex-col gap-1">
                Description
                <textarea
                  className="border rounded px-2 py-1"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  maxLength={300}
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                />
                Public Game
              </label>
              <label className="flex flex-col gap-1">
                Max Players
                <input
                  type="number"
                  className="border rounded px-2 py-1"
                  value={maxPlayers}
                  min={2}
                  max={8}
                  onChange={e => setMaxPlayers(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1">
                Min Players
                <input
                  type="number"
                  className="border rounded px-2 py-1"
                  value={minPlayers}
                  min={2}
                  max={maxPlayers}
                  onChange={e => setMinPlayers(Number(e.target.value))}
                />
              </label>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && (
                <div className="text-green-600 text-sm flex flex-col gap-2">
                  {success}
                  {gameUrl && (
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{gameUrl}</span>
                      <Button type="button" size="sm" onClick={handleCopy}>Copy Link</Button>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Game"}</Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            <Button>Save and see your changes instantly.</Button>
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
