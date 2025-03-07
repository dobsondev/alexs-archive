import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "~/server/auth";
import { scrapeGoodreads } from '~/app/_utils/scrapeGoodReads';
import { db } from "~/server/db";
import { books } from "~/server/db/schema";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  epubUploader: f({
    blob: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ files }) => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session || !session.user) throw new Error("Unauthorized");
      if (!files?.[0]) throw new Error("No file uploaded");

      let bookData = null;
      const goodreadsId = files[0].name.split(".epub")[0];

      if (!goodreadsId) {
        throw new Error("Invalid file name");
      }
      bookData = await scrapeGoodreads(goodreadsId);

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { 
        userId: session.user.id,
        bookData: bookData, 
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      const result = await db.insert(books).values({
        title: metadata.bookData.title,
        series: metadata.bookData.series ?? null,
        seriesNum: metadata.bookData.seriesNum ? Math.floor(metadata.bookData.seriesNum) : null,
        author: metadata.bookData.author,
        pageCount: metadata.bookData.pageCount ?? 0,
        publishedDate: metadata.bookData.publishedDate ?? 'Unknown',
        imageUrl: metadata.bookData.imageUrl,
        goodReadsUrl: metadata.bookData.goodReadsUrl,
        uploadthingUrl: file.ufsUrl,
        createdById: metadata.userId,
      }).returning({ insertedId: books.id });

      const bookId = result[0]?.insertedId;

      return { 
        uploadedBy: metadata.userId,
        bookTitle: metadata.bookData.title,
        bookId: bookId
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
