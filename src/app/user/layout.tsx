import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import TopBar from "~/app/_components/TopBar";

export const dynamic = 'force-dynamic';

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

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