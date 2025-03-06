import { db } from '~/server/db';
import { books } from '~/server/db/schema';
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
      <main className="p-8 grid grid-cols-3 gap-6">
        {books.map((book: Book) => {
          return (
            <BookCard key={book.id} book={book} />
          );
        })}
      </main>
    </>
  );
}