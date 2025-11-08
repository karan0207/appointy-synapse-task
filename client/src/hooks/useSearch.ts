// Goal: Custom hook for semantic search
// Handles POST request to /api/search with query

import { useState } from 'react';
import type { Item } from './useItems';

interface SearchResult extends Item {
  relevanceScore: number;
}

interface SearchResponse {
  success: boolean;
  data?: {
    results: SearchResult[];
    total: number;
    query: string;
  };
  error?: string;
}

export const useSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for session auth
        body: JSON.stringify({ query }),
      });

      const data: SearchResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.data?.results || []);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setResults([]);
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return { search, results, loading, error, clearResults };
};

