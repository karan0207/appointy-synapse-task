// Goal: Dedicated search page with search bar and results
// Focused interface for semantic search

import { useState } from 'react';
import Layout from '../components/Layout';
import MemoryGrid from '../components/MemoryGrid';
import { useSearch } from '../hooks/useSearch';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { search, results, loading, error, clearResults } = useSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await search(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearResults();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">
            Find anything in your second brain using natural language
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="max-w-2xl">
            <div className="relative">
              {/* Search Icon */}
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Input Field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search with natural language... (e.g., 'images I uploaded', 'links about react')"
                className="w-full pl-12 pr-36 py-4 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                autoFocus
              />
            
              {/* Right Side Buttons Container - Fixed Width */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2 pointer-events-none">
                {/* Clear Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="pointer-events-auto text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Search Button - Fixed Width */}
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || loading}
                  className="pointer-events-auto btn-primary px-5 py-2.5 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Searching</span>
                    </span>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Search Tips */}
        {!searchQuery && results.length === 0 && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Search Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Use natural language: "images I uploaded", "links about react"</li>
              <li>• Search by content: "docdaurus" will find images with that text</li>
              <li>• Filter by type: "images", "links", "files", "notes"</li>
              <li>• Combine filters: "images with text about meeting"</li>
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Search Error:</strong> {error}
            </p>
          </div>
        )}

        {/* No Results */}
        {!loading && searchQuery && results.length === 0 && !error && (
          <div className="mb-6 p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 mb-2">No results found for "{searchQuery}"</p>
            <p className="text-sm text-gray-500">Try different keywords or check if items have been processed</p>
          </div>
        )}

        {/* Results Count */}
        {!loading && results.length > 0 && (
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Found <span className="font-semibold text-gray-900">{results.length}</span> {results.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </p>
            <button
              onClick={handleClearSearch}
              className="text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Search Results */}
        <MemoryGrid items={results} loading={loading} error={error} />
      </div>
    </Layout>
  );
}

