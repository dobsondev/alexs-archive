import { Book } from '~/app/lib/definitions';

const mockBooks: Array<Book> = [
  {
    id: 123,
    title: "Fourth Wing",
    series: "The Empyrean",
    series_num: 3,
    author: "Rebecca Yarros",
    page_count: 517,
    published_date: "May 2, 2023",
    image_url: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1701980900i/61431922.jpg",
    good_reads_url: "https://www.goodreads.com/book/show/61431922-fourth-wing",
  },
  {
    id: 321,
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    page_count: 419,
    published_date: "June 2, 2020",
    image_url: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1620324329i/50659467.jpg",
    good_reads_url: "https://www.goodreads.com/book/show/50659467-a-court-of-thorns-and-roses",
  }
];

export { mockBooks };