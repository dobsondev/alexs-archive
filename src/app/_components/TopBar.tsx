'use client';

import { useSession, signOut } from "next-auth/react"
import Link from "next/link";
import { Dropdown } from "flowbite-react";

export default function TopBar() {
  const { data: session } = useSession()

  if (session && session.user) {
    return (
      <header className="flex w-full justify-end border-b-2 border-slate-800 gap-8 p-4">
        <Link href="/book/upload" className="border-r-2 border-slate-800 pr-8">Upload Book</Link>

        <Dropdown label="" dismissOnClick={false} renderTrigger={() => (
            <div>
              <span className="sr-only">Open user menu</span>
              <img className="w-6 h-6 rounded-full" src={session.user.image ?? "https://www.gravatar.com/avatar/?d=identicon"} alt="user photo" />
            </div>
          )}>
          <Dropdown.Item>
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
              <div className="font-medium truncate">{session.user.email}</div>
            </div>
          </Dropdown.Item>
          <Dropdown.Item>Kindle Email</Dropdown.Item>
          <Dropdown.Item>
            <a href="#" onClick={(e) => { e.preventDefault(); signOut();}} className="block w-full text-left">
              Sign out
            </a>
          </Dropdown.Item>
        </Dropdown>
      </header>
    )
  }
}

