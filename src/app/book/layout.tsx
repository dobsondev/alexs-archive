import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <>{children}</>;
}