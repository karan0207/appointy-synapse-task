// Goal: Custom hook for fetching items from API
// Handles GET request to /api/items

import { useState, useEffect } from 'react';

export interface Item {
  id: string;
  userId: string;
  type: string;
  title: string | null;
  summary: string | null;
  sourceUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  content?: {
    id: string;
    itemId: string;
    text: string | null;
    ocrText: string | null;
    html: string | null;
  } | null;
  media?: Array<{
    id: string;
    itemId: string;
    s3Url: string;
    mediaType: string;
    width: number | null;
    height: number | null;
  }>;
  embedding?: {
    id: string;
    itemId: string;
    vectorId: string;
  } | null;
}

interface ItemsResponse {
  success: boolean;
  data?: {
    items: Item[];
    total: number;
  };
  error?: string;
}

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/items', {
        credentials: 'include', // Send cookies for session auth
      });
      const data: ItemsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch items');
      }

      setItems(data.data?.items || []);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return { items, loading, error, refetch: fetchItems };
};

