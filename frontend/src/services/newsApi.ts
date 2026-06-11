const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface NewsArticle {
  _id: string;
  title: string;
  description?: string;
  source?: string;
  link: string;
  image?: string;
  category: string;
  publishedAt: string;
  createdAt: string;
}

export interface NewsResponse {
  success: boolean;
  category: string;
  count: number;
  data: NewsArticle[];
}

/**
 * Fetches news articles for a specific category from the backend database endpoint.
 */
export async function fetchNewsByCategory(category: string): Promise<NewsResponse> {
  const res = await fetch(`${API_BASE}/api/news/${category}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch news for category: ${category}`);
  }
  return res.json();
}
