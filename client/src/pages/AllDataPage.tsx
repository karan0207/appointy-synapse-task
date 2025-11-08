// Goal: All Data page with filters for different item types
// Shows all user data with filtering and professional representation

import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import MemoryGrid from '../components/MemoryGrid';
import { useItems } from '../hooks/useItems';
import type { Item } from '../hooks/useItems';

type FilterType = 'all' | 'NOTE' | 'ARTICLE' | 'IMAGE' | 'FILE' | 'TODO';

export default function AllDataPage() {
  const { items, loading, error } = useItems();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply type filter
    if (filter !== 'all') {
      filtered = items.filter(item => item.type === filter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [items, filter, sortBy]);

  const filterCounts = useMemo(() => {
    return {
      all: items.length,
      NOTE: items.filter(i => i.type === 'NOTE').length,
      ARTICLE: items.filter(i => i.type === 'ARTICLE').length,
      IMAGE: items.filter(i => i.type === 'IMAGE').length,
      FILE: items.filter(i => i.type === 'FILE').length,
      TODO: items.filter(i => i.type === 'TODO').length,
    };
  }, [items]);

  const filterOptions: Array<{ value: FilterType; label: string; icon: React.ReactNode }> = [
    {
      value: 'all',
      label: 'All',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      value: 'NOTE',
      label: 'Notes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      value: 'ARTICLE',
      label: 'Links',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      value: 'IMAGE',
      label: 'Images',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Data</h1>
          <p className="text-gray-600">
            Browse and filter all your saved items
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filter === option.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                {option.icon}
                <span>{option.label}</span>
                <span className={`
                  ml-1 px-2 py-0.5 rounded-full text-xs
                  ${filter === option.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {filterCounts[option.value]}
                </span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {filterOptions.slice(1).map((option) => (
            <div
              key={option.value}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setFilter(option.value)}
            >
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{filterCounts[option.value]}</p>
            </div>
          ))}
        </div>

        {/* Items Grid */}
        <div>
          {filteredAndSortedItems.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'items'}
                {filter !== 'all' && ` (${filter} only)`}
              </div>
              <MemoryGrid items={filteredAndSortedItems} loading={loading} error={error} />
            </>
          ) : (
            <div className="p-12 bg-white border border-gray-200 rounded-xl text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 mb-2">No {filter !== 'all' ? filter.toLowerCase() : ''} items found</p>
              <p className="text-sm text-gray-500">Try selecting a different filter or add new items</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

