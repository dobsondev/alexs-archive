export type Book = {
  id: number,
  title: string,
  series?: string,
  series_num?: number,
  author: string,
  page_count: number,
  published_date: string,
  image_url: string,
  good_reads_url: string,
}