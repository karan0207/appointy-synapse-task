// Goal: Custom hook for capturing files via API
// Handles file upload with progress tracking

import { useState } from 'react';

interface CaptureResponse {
  success: boolean;
  data?: {
    itemId: string;
    status: string;
    fileUrl?: string;
  };
  error?: string;
  message?: string;
}

export const useCaptureFile = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const captureFile = async (file: File): Promise<string | null> => {
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/capture/file', {
        method: 'POST',
        credentials: 'include', // Send cookies for session auth
        body: formData,
      });

      const data: CaptureResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setProgress(100);
      setLoading(false);
      return data.data?.itemId || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      setProgress(0);
      return null;
    }
  };

  return { captureFile, loading, progress, error };
};

