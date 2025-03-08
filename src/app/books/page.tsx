import { db } from '~/server/db';
import { type books } from '~/server/db/schema';
import Breadcrumbs from "~/app/_components/Breadcrumbs";
import BookCard from "~/app/_components/BookCard";

type Book = typeof books.$inferSelect;

export const dynamic = 'force-dynamic';

export default async function bookDashboard() {
  const books = await db.query.books.findMany();

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          { 
            label: 'Books', 
            href: '/books',
            active: true,
          }
        ]}
      /
      >
      <main className="p-8 grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {books.map((book: Book) => {
          return (
            <BookCard key={book.id} book={book} />
          );
        })}
      </main>
    </>
  );
}