'use client';

import { signIn } from "next-auth/react"

export default function SignInButton() {
  return (
    <button className="w-32 px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700" onClick={() => signIn()}>Sign in</button>
  );
}
