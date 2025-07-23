'use client';

import { useSession, signOut } from "next-auth/react"
import Link from "next/link";
import Image from 'next/image';
import { Dropdown } from "flowbite-react";
import KindleEmailSelector from './KindleEmailSelector';

export const dynamic = 'force-dynamic';

export default function TopBar() {
  const { data: session } = useSession()

  if (session && session.user) {
    return (
      <header className="flex w-full justify-end border-b-2 border-slate-800 gap-8 p-4">
        {session.user.uploadPermission && (
          <>
            <KindleEmailSelector />
            <Link href="/books/upload" className="border-r-2 border-slate-800 pr-8">
              Upload Book
            </Link>
          </>
        )}

        <Dropdown label="" dismissOnClick={false} renderTrigger={() => (
            <div>
              <span className="sr-only">Open user menu</span>
              <Image 
                className="w-6 h-6 rounded-full" 
                src={`${session.user.image ?? "https://www.gravatar.com/avatar/?d=identicon"}&t=${encodeURIComponent(session.user.email ?? '')}`} 
                alt="user photo"
                width={24}
                height={24}
                unoptimized
              />
            </div>
          )}>
          <Dropdown.Item>
            <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
              <div className="font-medium truncate">{session.user.email}</div>
            </div>
          </Dropdown.Item>
          <Dropdown.Item>
            <Link href="/user/profile">Profile Settings</Link>
          </Dropdown.Item>
          <Dropdown.Item>
            <a href="#" onClick={(e) => { e.preventDefault(); void signOut();}} className="block w-full text-left">
              Sign out
            </a>
          </Dropdown.Item>
        </Dropdown>
      </header>
    )
  }
}

