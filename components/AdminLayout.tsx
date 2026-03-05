'use client';

import { LogoutButton } from './LogoutButton';
import Link from 'next/link';

type Props = {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'users' | 'images' | 'captions';
  userEmail: string;
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'users', label: 'Users', href: '/dashboard/users' },
  { id: 'images', label: 'Images', href: '/dashboard/images' },
  { id: 'captions', label: 'Captions', href: '/dashboard/captions' },
] as const;

export function AdminLayout({ children, currentPage, userEmail }: Props) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-400">{userEmail}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'text-white border-b-2 border-amber-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
