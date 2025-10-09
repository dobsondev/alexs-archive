'use client';

import Link from "next/link";

export default function SignInButton() {
  return (
    <Link
      href="/sign-in"
      className="inline-block w-32 px-4 py-2 text-center text-white bg-purple-600 rounded-md hover:bg-purple-700"
    >
      Sign in
    </Link>
  );
}
