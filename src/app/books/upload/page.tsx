"use client";

import { useRouter } from 'next/navigation';
import Breadcrumbs from "~/app/_components/Breadcrumbs";
import { UploadButton } from "~/app/_utils/uploadthing";

export default async function UploadBookPage() {
  const router = useRouter();

  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          { 
            label: 'Books',
            href: '/books' 
          },
          {
            label: 'Upload Book',
            href: '/books/upload',
            active: true,
          },
        ]}
      />
      <main className="flex min-h-screen flex-col items-center p-24">
        <div className="w-56 rounded-md border border-slate-500 m-8 p-8">
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

        <div className="max-w-prose mt-8">
          <p className="mb-4">
            All files need to include the Good Reads ID of the book as the file name in order for the automatic scraping of the book information to occur.
          </p>
          <h2 className="text-2xl mb-4 font-semibold">How to find a GoodReads ID</h2>
          <ol className="list-decimal mb-2 px-8">
            <li>Go to the book page on GoodReads</li>
            <li>Look at the URL, which will be in the format: https://www.goodreads.com/book/show/[ID]-[title]</li>
          </ol>
          <p className="mb-4">
            For example, we want to use the filename <b>61431922-fourth-wing.epub</b> for "Fourth Wing" which can be found here:
          </p>
          <p className="py-2">
            &bull; <a className="text-blue-500" href="https://www.goodreads.com/book/show/61431922-fourth-wing" target="_blank">https://www.goodreads.com/book/show/61431922-fourth-wing</a>
          </p>
        </div>
      </main>
    </>
  );
}