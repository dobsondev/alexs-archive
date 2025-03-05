import { books } from '~/server/db/schema';
import { ArrowUpRightIcon } from "@heroicons/react/16/solid";

type Book = typeof books.$inferSelect;

export default function BookCard({ book }: { book: Book }) {
  if (book.id) {
    return (
      <div className="book-card border border-slate-800 rounded-md p-4 grid grid-cols-2 gap-6">
        <div className="col-span-1">
          <img src={book.imageUrl} alt="{book.title} Cover" className="rounded-md w-full h-auto" />
        </div>
        <div className="col-span-1">
          <div className="h-full flex flex-col justify-evenly gap-4">
            <div>
              <div className="mb-4">
                {book.series &&
                  <h3 className="text-sm font-thin">{book.series} #{book.seriesNum}</h3>
                }
                <h2 className="text-2xl font-extrabold">{book.title}</h2>
                <h3 className="text-m font-thin">{book.author}</h3>
              </div>
              <div>
                <p className="text-sm">
                  {book.pageCount} Pages
                </p>
                <p className="text-sm mb-2">
                  {book.publishedDate}
                </p>
                <p>
                  <a className="text-blue-400 text-sm" href={book.goodReadsUrl} target="_blank">
                    Good Reads <ArrowUpRightIcon className="inline size-4" />
                  </a>
                </p>
              </div>
            </div>
            <div className="gap-4">
              <a className="block rounded-md border border-purple-600 text-slate-400 py-2 px-4 mt-2 text-sm text-center font-semibold hover:border-purple-400 hover:bg-purple-400 hover:text-slate-800" href="#">Download ePub</a>
              <a className="block rounded-md border border-orange-600 text-slate-400 py-2 px-4 mt-2 text-sm text-center font-semibold hover:border-orange-400 hover:bg-orange-400 hover:text-slate-800" href="#">Send to Kindle</a>
            </div>
          </div>
        </div>
      </div>

    );
  }
}
