'use client';

import { useEffect, useState } from 'react';
import { type books } from '~/server/db/schema';
import Breadcrumbs from "~/app/_components/Breadcrumbs";
import BookCard from "~/app/_components/BookCard";
import BookSearch from "~/app/_components/BookSearch";
import { fuzzySearchBooks } from "~/app/_utils/fuzzySearch";

type Book = typeof books.$inferSelect;

export default function BookDashboard() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/books');
        const books = await response.json() as Book[];
        setAllBooks(books);
        setFilteredBooks(books);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchBooks();
  }, []);

  const handleSearch = (query: string) => {
    const results = fuzzySearchBooks(allBooks, query);
    setFilteredBooks(results);
  };

  if (isLoading) {
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
        />
        <main className="p-8">
          <div className="text-center text-slate-400">Loading books...</div>
        </main>
      </>
    );
  }

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
      />
      <main className="p-8">
        <BookSearch onSearch={handleSearch} />
        {filteredBooks.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            {allBooks.length === 0 ? 'No books found.' : 'No books match your search.'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredBooks.map((book: Book) => {
              return (
                <BookCard key={book.id} book={book} />
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}