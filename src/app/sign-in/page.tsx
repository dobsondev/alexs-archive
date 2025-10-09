'use client';

import { useState } from 'react';
import { signIn } from '~/app/_lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: '/books',
      });

      if (result.error) {
        setError(result.error.message ?? 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      // Redirect to books page
      router.push('/books');
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          {"Alex's Archive"}
        </h1>

        <div className="w-full max-w-md">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-white">Sign In</h2>

            {error && (
              <div className="mb-4 rounded-md border border-red-500 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-300">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
