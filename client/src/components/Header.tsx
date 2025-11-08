// Goal: Header component with branding, actions, and user info
// Displays app name, user info, and primary action buttons

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onAddClick?: () => void;
}

export default function Header({ onAddClick }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/">
              <h1 className="text-2xl font-bold text-primary cursor-pointer hover:opacity-80">
                ⚡ Synapse
              </h1>
            </Link>
            <p className="ml-4 text-gray-500 text-sm hidden sm:block">
              Your intelligent second brain
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/settings"
                className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline"
              >
                {user.name || user.email}
              </Link>
            )}
            {onAddClick && (
              <button onClick={onAddClick} className="btn-primary">
                + Add Item
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

