import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';

export default async function BookUploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  if (!session.user || !session.user.uploadPermission) {
    redirect("/books");
  }

  return <>{children}</>;
}
