'use client';

import { useSession, signIn, signOut } from "next-auth/react"

export default function TopBar() {
  const { data: session } = useSession()

  if (session && session.user) {
    return (
      <header className="flex justify-end gap-8 p-4">
        <img src={session.user.image ?? "https://www.gravatar.com/avatar/?d=identicon"} alt="Profile Picture" className="rounded-full h-6" />
        <button onClick={() => signOut()}>Sign out</button>
      </header>
    )
  }
  return (
    <header className="flex justify-end gap-8 p-4">
      <button onClick={() => signIn()}>Sign in</button>
    </header>
  )
}
