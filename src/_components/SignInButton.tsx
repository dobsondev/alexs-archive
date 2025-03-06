'use client';

import { signIn } from "next-auth/react"

export default function SignInButton() {
  return (
    <button className="w-28 rounded-md bg-purple-600 text-white py-2 px-4 font-semibold hover:bg-purple-400 hover:text-slate-800" onClick={() => signIn()}>Sign in</button>
  );
}
