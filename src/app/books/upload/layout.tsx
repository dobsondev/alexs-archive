import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function BookUploadLayout({
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

  // Type assertion for custom fields that exist in database
  const user = session.user as typeof session.user & { uploadPermission?: boolean };
  if (!user || !user.uploadPermission) {
    redirect("/books");
  }

  return <>{children}</>;
}
