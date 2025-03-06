import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import SignInButton from '~/_components/SignInButton';

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Alexs Archive
        </h1>
        <SignInButton />
      </div>
    </main>
  );
}
