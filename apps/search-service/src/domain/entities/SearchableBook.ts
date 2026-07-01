export interface SearchableBook {
  isbn: string;
  title: string;
  author: string;
  description: string;
  category?: string;
  publishedYear?: number;
  indexedAt: string;
}
