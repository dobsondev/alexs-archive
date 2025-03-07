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

    // Extract the book title
    const title = $('h1.Text__title1').text().trim();

    // Extract the author name
    const author = $('span.ContributorLink__name').first().text().trim();

    // Extract the cover image
    const imageUrl = $('img.ResponsiveImage').attr('src') ?? '';

    // Extract the page count
    let pageCount = 0;
    $('div.FeaturedDetails').each((_, element) => {
      const text = $(element).text();
      if (text.includes('pages')) {
        const pagesMatch = /(\d+)\s+pages/.exec(text);
        if (pagesMatch?.[1]) {
          pageCount = parseInt(pagesMatch[1], 10);
        }
      }
    });

    const publishedDate = $('p[data-testid="publicationInfo"]').text().replace('First published', '').trim() ?? null;

    // Extract series information
    const seriesElement = $('h3.Text.Text__title3.Text__italic:contains("#")');
    let series = null;
    let seriesNum = null;

    if (seriesElement.length > 0) {
      // Get the series info from the element text or the aria-label
      const seriesText = seriesElement.text().trim() ?? seriesElement.attr('aria-label') ?? '';

      // If there's a link inside with more specific text, use that instead
      const seriesLink = seriesElement.find('a');
      const fullSeriesText = seriesLink.length > 0 ? seriesLink.text().trim() : seriesText;

      // Simple split by '#' 
      if (fullSeriesText.includes('#')) {
        const parts = fullSeriesText.split('#');
        if (parts[0]) {
          series = parts[0].trim();
        }
        seriesNum = parts.length > 1 && parts[1] ? parseFloat(parts[1]) : null;
      } else {
        series = fullSeriesText;
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