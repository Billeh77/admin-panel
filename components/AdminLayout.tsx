'use client';

import { LogoutButton } from './LogoutButton';
import Link from 'next/link';
import { useState } from 'react';

type PageId = 
  | 'dashboard' 
  | 'users' 
  | 'images' 
  | 'captions' 
  | 'caption-requests'
  | 'caption-examples'
  | 'humor-flavors'
  | 'humor-steps'
  | 'humor-mix'
  | 'terms'
  | 'llm-models'
  | 'llm-providers'
  | 'llm-chains'
  | 'llm-responses'
  | 'allowed-domains'
  | 'whitelist-emails';

type Props = {
  children: React.ReactNode;
  currentPage: PageId;
  userEmail: string;
};

type NavGroup = {
  label: string;
  items: { id: PageId; label: string; href: string }[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'users', label: 'Users', href: '/dashboard/users' },
      { id: 'images', label: 'Images', href: '/dashboard/images' },
      { id: 'captions', label: 'Captions', href: '/dashboard/captions' },
      { id: 'caption-requests', label: 'Requests', href: '/dashboard/caption-requests' },
      { id: 'caption-examples', label: 'Examples', href: '/dashboard/caption-examples' },
    ],
  },
  {
    label: 'Humor',
    items: [
      { id: 'humor-flavors', label: 'Flavors', href: '/dashboard/humor-flavors' },
      { id: 'humor-steps', label: 'Steps', href: '/dashboard/humor-steps' },
      { id: 'humor-mix', label: 'Mix', href: '/dashboard/humor-mix' },
      { id: 'terms', label: 'Terms', href: '/dashboard/terms' },
    ],
  },
  {
    label: 'LLM',
    items: [
      { id: 'llm-models', label: 'Models', href: '/dashboard/llm-models' },
      { id: 'llm-providers', label: 'Providers', href: '/dashboard/llm-providers' },
      { id: 'llm-chains', label: 'Chains', href: '/dashboard/llm-chains' },
      { id: 'llm-responses', label: 'Responses', href: '/dashboard/llm-responses' },
    ],
  },
  {
    label: 'Access',
    items: [
      { id: 'allowed-domains', label: 'Domains', href: '/dashboard/allowed-domains' },
      { id: 'whitelist-emails', label: 'Whitelist', href: '/dashboard/whitelist-emails' },
    ],
  },
];

export function AdminLayout({ children, currentPage, userEmail }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation - higher z-index than content */}
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {navGroups.map((group) => {
              const isActive = group.items.some(i => i.id === currentPage);
              const isOpen = openGroup === group.label;
              const isSingleItem = group.items.length === 1;
              
              // Single item - render as direct link
              if (isSingleItem) {
                return (
                  <Link
                    key={group.label}
                    href={group.items[0].href}
                    className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
                      isActive
                        ? 'text-white bg-amber-600/20 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {group.label}
                  </Link>
                );
              }
              
              // Multiple items - render as dropdown
              return (
                <div 
                  key={group.label} 
                  className="relative"
                  onMouseEnter={() => setOpenGroup(group.label)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 rounded-md ${
                      isActive
                        ? 'text-white bg-amber-600/20 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {group.label}
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown - positioned absolutely with high z-index */}
                  {isOpen && (
                    <div 
                      className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 min-w-[160px]"
                      style={{ zIndex: 9999 }}
                    >
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            currentPage === item.id
                              ? 'text-amber-400 bg-slate-700/50'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content - lower z-index than navigation */}
      <main className="max-w-7xl mx-auto px-4 py-6 relative z-0">
        {children}
      </main>
    </div>
  );
}
