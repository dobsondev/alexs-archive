"use client";

import { useRouter } from 'next/navigation';
import Link from "next/link";
import Breadcrumbs from "~/app/_components/Breadcrumbs";
import { UploadButton } from "~/app/_utils/uploadthing";

export default function UploadBookPage() {
  const router = useRouter();

  return (
    <>
      <main className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Upload a Book</h1>

        <div className="mb-6">
          <Link href="/books" className="text-slate-500 text-sm hover:underline">
            ← Back to Books
          </Link>
        </div>

        <div className="w-full mb-8 border rounded-md px-4 pt-8 pb-6 border-slate-500">
          <UploadButton
            endpoint="epubUploader"
            onClientUploadComplete={(res) => {
              // Do something with the response
              // Check if we have a response and at least one file was uploaded
              if (res && res.length > 0) {
                console.log(res);
                const fileData = res[0];
                
                // Access the metadata that was returned from the server
                if (!fileData) {
                  console.error("No file data in response:", fileData);
                  return;
                }

                const bookId = fileData.serverData.bookId;
                
                if (bookId) {
                  console.log(`Redirecting to book ID: ${bookId}`);
                  router.push(`/books/${bookId}`);
                } else {
                  console.error("Book ID not found in response:", fileData.serverData);
                  alert("Book uploaded but ID not returned. Check console for details.");
                }
              }
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>

        <div className="max-w-prose mt-8 text-sm text-slate-400">
          <p className="mb-4">
            All files need to include the Goodreads ID of the book as the file name in order for the automatic scraping of the book information to occur.
          </p>
          <h2 className="text-2xl mb-4 font-semibold">How to find a GoodReads ID</h2>
          <ol className="list-decimal mt-1 mb-4 px-8">
            <li>Go to the book page on Goodreads</li>
            <li>Look at the URL, which will be in the format: https://www.goodreads.com/book/show/[ID]-[title]</li>
          </ol>
          <p className="mt-1">
            For example, we want to use the filename <span className="font-semibold underline">61431922-fourth-wing.epub</span> for &quot;Fourth Wing&quot; which can be found here:
          </p>
          <p className="mt-1 px-4">
            &bull; <a className="text-blue-500 hover:underline" href="https://www.goodreads.com/book/show/61431922-fourth-wing" target="_blank">https://www.goodreads.com/book/show/61431922-fourth-wing</a>
          </p>
          <p className="mt-1">
            As you can see, we extracted the file name of <span className="font-semibold underline">61431922-fourth-wing.epub</span> from the URL above. 
            You may also see extra text and letters after the ID, usually prefixed with a <span className="font-semibold underline">?</span>. 
            That could look something like this:
          </p>
          <p className="mt-1 px-4">
            &bull; <span className="font-semibold underline">.../61431922-fourth-wing?ac=1&from_search=true</span>
          </p>
          <p className="mt-1">
            All of that should be ignored and not included in the file name.
          </p>
        </div>
      </main>
    </>
  );
}