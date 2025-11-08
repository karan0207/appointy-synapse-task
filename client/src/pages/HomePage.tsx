// Goal: Home page with memory grid and search
// Main view of the application

import { useState } from 'react';
import Header from '../components/Header';
import AddItemModal from '../components/AddItemModal';
import MemoryGrid from '../components/MemoryGrid';
import { useItems } from '../hooks/useItems';
import { useSearch } from '../hooks/useSearch';

export default function HomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const { items, loading: itemsLoading, error: itemsError, refetch } = useItems();
  const { search, results, loading: searchLoading, error: searchError, clearResults } = useSearch();

  const handleAddSuccess = () => {
    refetch();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchMode(true);
      await search(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    clearResults();
  };

  const displayItems = isSearchMode ? results : items;
  const loading = isSearchMode ? searchLoading : itemsLoading;
  const error = isSearchMode ? searchError : itemsError;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAddClick={() => setIsAddModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search input */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your second brain with natural language..."
              className="w-full px-4 py-3 pr-24 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              disabled={!searchQuery.trim() || searchLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary py-2 disabled:opacity-50"
            >
              {searchLoading ? '...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search status messages */}
        {isSearchMode && !loading && searchError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Search Error:</strong> {searchError}
            </p>
            {searchError.includes('no models loaded') && (
              <p className="text-xs text-yellow-700 mt-2">
                💡 To enable search, download an embedding model. See WORKER-FIXES.md for instructions.
              </p>
            )}
          </div>
        )}
        
        {isSearchMode && !loading && !searchError && results.length === 0 && searchQuery && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              No results found for "{searchQuery}". Try different keywords or check if items have been processed.
            </p>
          </div>
        )}

        {/* Results count */}
        {!loading && displayItems.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {isSearchMode ? (
                <>
                  Found {displayItems.length} {displayItems.length === 1 ? 'result' : 'results'} 
                  {' '}for "{searchQuery}"
                </>
              ) : (
                <>
                  {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'} in your memory
                </>
              )}
            </p>
            {isSearchMode && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Memory Grid or Search Results */}
        <MemoryGrid items={displayItems} loading={loading} error={error} />
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}

