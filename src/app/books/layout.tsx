import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import TopBar from "~/app/_components/TopBar";

export const dynamic = 'force-dynamic';

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <TopBar />
      {children}
    </>
  );
}