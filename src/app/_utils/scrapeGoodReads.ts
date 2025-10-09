import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedBookData {
  title: string;
  series: string | null;
  seriesNum: number | null;
  author: string;
  pageCount: number;
  publishedDate: string | null;
  imageUrl: string;
  goodReadsUrl: string;
}

export async function scrapeGoodreads(goodreadsId: string): Promise<ScrapedBookData> {
  try {
    // Make the request to GoodReads
    const response = await axios.get(`https://www.goodreads.com/book/show/${goodreadsId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    const html = response.data as string;
    const $ = cheerio.load(html);

    // Find the Apollo state JSON embedded in the page
    const scriptTags = $('script[type="application/json"]');
    let apolloState: Record<string, any> = {};

    scriptTags.each((_, element) => {
      const content = $(element).html();
      if (content && content.includes('apolloState')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.props?.pageProps?.apolloState) {
            apolloState = parsed.props.pageProps.apolloState;
          }
        } catch (e) {
          // Continue to next script tag
        }
      }
    });

    // Find the book object in the Apollo state
    let bookData: any = null;
    for (const key in apolloState) {
      if (key.startsWith('Book:')) {
        bookData = apolloState[key];
        break;
      }
    }

    if (!bookData) {
      throw new Error('Could not find book data in Apollo state');
    }

    // Extract the book title
    const title = bookData.title ?? '';

    // Extract the author name (resolve the __ref to get the actual contributor object)
    let author = '';
    if (bookData.primaryContributorEdge?.node?.__ref) {
      const contributorRef = bookData.primaryContributorEdge.node.__ref;
      const contributorData = apolloState[contributorRef];
      author = contributorData?.name ?? '';
    } else if (bookData.primaryContributorEdge?.node?.name) {
      author = bookData.primaryContributorEdge.node.name;
    }

    // Extract the cover image
    const imageUrl = bookData.imageUrl ?? '';

    // Extract the page count
    const pageCount = bookData.details?.numPages ?? 0;

    // Extract the published date
    let publishedDate = null;
    if (bookData.details?.publicationTime) {
      const date = new Date(bookData.details.publicationTime);
      publishedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Extract series information from bookSeries array (resolve the __ref)
    let series = null;
    let seriesNum = null;

    if (bookData.bookSeries && bookData.bookSeries.length > 0) {
      const seriesInfo = bookData.bookSeries[0];
      seriesNum = seriesInfo.userPosition ? parseFloat(seriesInfo.userPosition) : null;

      if (seriesInfo.series?.__ref) {
        const seriesRef = seriesInfo.series.__ref;
        const seriesData = apolloState[seriesRef];
        series = seriesData?.title ?? null;
      } else if (seriesInfo.series?.title) {
        series = seriesInfo.series.title;
      }
    }

    const goodReadsUrl = `https://www.goodreads.com/book/show/${goodreadsId}`;

    return {
      title,
      series,
      seriesNum,
      author,
      pageCount,
      publishedDate,
      imageUrl,
      goodReadsUrl
    };
  } catch (error) {
    console.error('Error scraping GoodReads:', error);
    throw new Error('Failed to scrape GoodReads page');
  }
}