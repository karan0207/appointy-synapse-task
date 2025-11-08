// Goal: Custom hook for capturing links via API
// Handles POST request to /api/capture/link

import { useState } from 'react';

interface CaptureResponse {
  success: boolean;
  data?: {
    itemId: string;
    status: string;
  };
  error?: string;
  message?: string;
}

export const useCaptureLink = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLink = async (url: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/capture/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for session auth
        body: JSON.stringify({ url }),
      });

      const data: CaptureResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to capture link');
      }

      setLoading(false);
      return data.data?.itemId || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  return { captureLink, loading, error };
};

