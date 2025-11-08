// Goal: Display individual item in memory grid
// Shows item preview with type badge and timestamp

import type { Item } from '../hooks/useItems';

interface ItemCardProps {
  item: Item;
}

const TYPE_COLORS: Record<string, string> = {
  NOTE: 'bg-blue-100 text-blue-800',
  ARTICLE: 'bg-green-100 text-green-800',
  PRODUCT: 'bg-purple-100 text-purple-800',
  IMAGE: 'bg-pink-100 text-pink-800',
  TODO: 'bg-yellow-100 text-yellow-800',
  FILE: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-600',
  PROCESSING: 'text-blue-600',
  PROCESSED: 'text-green-600',
  FAILED: 'text-red-600',
};

export default function ItemCard({ item }: ItemCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // Format date (include year if older than 1 year)
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffInDays > 365 ? 'numeric' : undefined
    });

    // Format time
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });

    // Always show both date and time
    return `${dateStr} • ${timeStr}`;
  };

  const getPreviewText = () => {
    // For other types, show content text as before
    if (item.content?.text) {
      return item.content.text.substring(0, 200);
    }
    return item.title || 'No content';
  };

  // For IMAGE type, show minimal view: only image and filename
  if (item.type === 'IMAGE') {
    return (
      <div className="card hover:shadow-md transition-shadow cursor-pointer p-0 overflow-hidden">
        {/* Image Preview */}
        {item.media && item.media.length > 0 && item.media[0].s3Url ? (
          <>
            <img
              src={item.media[0].s3Url}
              alt={item.title || 'Image'}
              className="w-full h-64 object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Filename */}
            {item.title && (
              <div className="p-3">
                <p className="text-sm text-gray-600 truncate" title={item.title}>
                  {item.title}
                </p>
              </div>
            )}
          </>
        ) : (
          // Fallback if no image URL
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">{item.title || 'Image'}</p>
          </div>
        )}
      </div>
    );
  }

  // For other types, show full card
  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      {/* Preview Image for Links */}
      {item.media && item.media.length > 0 && item.media[0].s3Url && (
        <div className="mb-3 -mt-4 -mx-4">
          <img
            src={item.media[0].s3Url}
            alt={item.title || 'Preview'}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${TYPE_COLORS[item.type] || TYPE_COLORS.NOTE}`}>
          {item.type}
        </span>
        <span className={`text-xs ${STATUS_COLORS[item.status] || STATUS_COLORS.PENDING}`}>
          {item.status === 'PENDING' && '⏳'}
          {item.status === 'PROCESSING' && '⚙️'}
          {item.status === 'PROCESSED' && '✓'}
          {item.status === 'FAILED' && '✗'}
        </span>
      </div>

      {/* Title */}
      {item.title && (
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {item.title}
        </h3>
      )}

      {/* Preview */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {getPreviewText()}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Created at {formatDate(item.createdAt)}</span>
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit
          </a>
        )}
      </div>
    </div>
  );
}

