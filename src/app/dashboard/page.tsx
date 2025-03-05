import { db } from '~/server/db';
import { books } from '~/server/db/schema';
import BookCard from "~/_components/BookCard";

type Book = typeof books.$inferSelect;

export const dynamic = 'force-dynamic';

export default async function bookDashboard() {
  const books = await db.query.books.findMany();

  return (
    <main className="p-8 grid grid-cols-3 gap-6">

      {books.map((book: Book) => {
        return (
          <BookCard key={book.id} book={book} />
        );
      })}

    </main>
  );
}
