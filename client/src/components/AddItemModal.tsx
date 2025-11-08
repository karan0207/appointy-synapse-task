// Goal: Modal component for adding new items
// Supports text input with validation and loading states

import { useState, useEffect, useRef } from 'react';
import { useCapture } from '../hooks/useCapture';
import { useCaptureLink } from '../hooks/useCaptureLink';
import { useCaptureFile } from '../hooks/useCaptureFile';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = 'text' | 'link' | 'file';

export default function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { captureText, loading: textLoading, error: textError } = useCapture();
  const { captureLink, loading: linkLoading, error: linkError } = useCaptureLink();
  const { captureFile, loading: fileLoading, progress, error: fileError } = useCaptureFile();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loading = textLoading || linkLoading || fileLoading;
  const error = textError || linkError || fileError;

  // Focus input when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'text' && textareaRef.current) {
        textareaRef.current.focus();
      } else if (activeTab === 'link' && urlInputRef.current) {
        urlInputRef.current.focus();
      }
    }
  }, [isOpen, activeTab]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setText('');
      setUrl('');
      setFile(null);
      setShowSuccess(false);
      setActiveTab('text');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let itemId: string | null = null;

    if (activeTab === 'text') {
      if (!text.trim()) return;
      itemId = await captureText(text.trim());
      if (itemId) setText('');
    } else if (activeTab === 'link') {
      if (!url.trim()) return;
      itemId = await captureLink(url.trim());
      if (itemId) setUrl('');
    } else if (activeTab === 'file') {
      if (!file) return;
      itemId = await captureFile(file);
      if (itemId) setFile(null);
    }

    if (itemId) {
      setShowSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Add New Item</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'link'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔗 Link
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'file'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📎 File
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="mb-4">
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                Text / Note
              </label>
              <textarea
                ref={textareaRef}
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type or paste your text here... (⌘+Enter to submit)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={8}
                disabled={loading}
                maxLength={50000}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {text.length} / 50,000 characters
                </p>
                <p className="text-xs text-gray-500">
                  Tip: Press ⌘+Enter (Mac) or Ctrl+Enter (Windows) to submit
                </p>
              </div>
            </div>
          )}

          {/* Link Tab */}
          {activeTab === 'link' && (
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                URL / Link
              </label>
              <input
                ref={urlInputRef}
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com/article"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll automatically fetch the title, description, and preview image
              </p>
            </div>
          )}

          {/* File Tab */}
          {activeTab === 'file' && (
            <div className="mb-4">
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  disabled={loading}
                />
                
                {!file ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline font-medium"
                      >
                        Choose a file
                      </button>
                      {' '}or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images, PDFs, documents up to 10MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-900 font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="mt-2 text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              {progress > 0 && progress < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success message */}
          {showSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Item captured successfully!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                loading || 
                showSuccess || 
                (activeTab === 'text' && !text.trim()) || 
                (activeTab === 'link' && !url.trim()) ||
                (activeTab === 'file' && !file)
              }
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

