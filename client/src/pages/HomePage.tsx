// Goal: Home page focused on adding items
// Quick capture interface with recent items

import { useState } from 'react';
import Layout from '../components/Layout';
import AddItemModal from '../components/AddItemModal';
import MemoryGrid from '../components/MemoryGrid';
import { useItems } from '../hooks/useItems';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { items, loading, error, refetch } = useItems();

  const handleAddSuccess = () => {
    refetch();
    setIsAddModalOpen(false);
  };

  // Get recent items (last 6)
  const recentItems = items.slice(0, 6);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home</h1>
          <p className="text-gray-600">
            Quickly capture and access your thoughts
          </p>
        </div>

        {/* Quick Add Section */}
        <div className="mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Capture Something New</h2>
              <p className="text-gray-600">Add text, links, files, or images to your second brain</p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Quick Note</p>
                    <p className="text-sm text-gray-500">Capture a thought or idea</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Save Link</p>
                    <p className="text-sm text-gray-500">Bookmark a webpage</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload File</p>
                    <p className="text-sm text-gray-500">Add image or document</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Items */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Items</h2>
          {items.length > 6 && (
            <Link
              to="/all-data"
              className="text-sm text-primary hover:underline font-medium"
            >
              View All →
            </Link>
          )}
        </div>

        {recentItems.length > 0 ? (
          <MemoryGrid items={recentItems} loading={loading} error={error} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-600 mb-2">No items yet</p>
            <p className="text-sm text-gray-500 mb-4">Start by adding your first item</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary mt-4"
            >
              Add Your First Item
            </button>
          </div>
        )}

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </div>
    </Layout>
  );
}

