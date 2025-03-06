import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { books } from '~/server/db/schema';
import BookCard from "~/app/_components/BookCard";
import Breadcrumbs from "~/app/_components/Breadcrumbs";

type Book = typeof books.$inferSelect;

export const dynamic = 'force-dynamic';

export default async function BookPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const book: Book | undefined = await db.query.books.findFirst({
    where: eq(books.id, parseInt(id, 10))
  });

  if (!book) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          { 
            label: 'Books', 
            href: '/books' 
          },
          {
            label: book.title,
            href: '/books/' + book.id,
            active: true,
          },
        ]}
      />
      <main className="p-8 grid grid-cols-3 gap-6">
        <BookCard key={book.id} book={book} />
      </main>
    </>
  );
}
