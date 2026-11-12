interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
    language?: string;
  };
}

interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

const API_URL = "https://www.googleapis.com/books/v1/volumes";

export const normalizeGoogleBook = (volume: GoogleBooksVolume) => {
  const info = volume.volumeInfo;

  const isbn = info.industryIdentifiers?.find(
    (item) => item.type === "ISBN_13"
  )?.identifier
    ?? info.industryIdentifiers?.find(
      (item) => item.type === "ISBN_10"
    )?.identifier;

  return {
    googleBooksId: volume.id,
    title: info.title ?? "Untitled",
    authors: info.authors ?? [],
    publisher: info.publisher ?? "",
    publishedDate: info.publishedDate ?? "",
    description: info.description ?? "",
    isbn: isbn ?? "",
    pageCount: info.pageCount ?? 0,
    language: info.language ?? "",
    thumbnail: info.imageLinks?.thumbnail?.replace(
      /^http:\/\//,
      "https://"
    ) ?? "",
    categories: info.categories ?? []
  };
};

export const searchBooks = async (
  query: string,
  maxResults = 20,
  startIndex = 0
) => {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    startIndex: String(startIndex)
  });

 if (process.env.GOOGLE_BOOKS_API_KEY) {
  params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
}

  const response = await fetch(`${API_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json() as GoogleBooksSearchResponse;

  return {
    totalItems: data.totalItems,
    books: (data.items ?? []).map(normalizeGoogleBook)
  };
};

export const getBookById = async (volumeId: string) => {
  const params = new URLSearchParams();

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const query = params.toString();
  const url = `${API_URL}/${encodeURIComponent(volumeId)}${query ? `?${query}` : ""}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Book not found on Google Books");
    }

    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json() as GoogleBooksVolume;

  return normalizeGoogleBook(data);
};