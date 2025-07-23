import { type books } from '~/server/db/schema';

type Book = typeof books.$inferSelect;

/**
 * Simple fuzzy search implementation that searches through title, author, and series
 * Returns books that match the query with a relevance score
 */
export function fuzzySearchBooks(books: Book[], query: string): Book[] {
  if (!query.trim()) {
    return books;
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const scoredBooks = books.map(book => {
    let score = 0;
    const searchableText = [
      book.title?.toLowerCase() ?? '',
      book.author?.toLowerCase() ?? '',
      book.series?.toLowerCase() ?? ''
    ].join(' ');

    // Check for exact matches (higher score)
    searchTerms.forEach(term => {
      if (searchableText.includes(term)) {
        score += term.length * 2; // Longer terms get higher scores
      }
    });

    // Check for partial matches
    searchTerms.forEach(term => {
      const words = searchableText.split(/\s+/);
      words.forEach(word => {
        if (word.includes(term) && word !== term) {
          score += term.length; // Partial matches get lower scores
        }
      });
    });

    return { book, score };
  });

  // Filter out books with no matches and sort by relevance
  return scoredBooks
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ book }) => book);
}