'use client';

import { LogoutButton } from './LogoutButton';
import Link from 'next/link';

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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', group: 'Overview' },
  { id: 'users', label: 'Users', href: '/dashboard/users', group: 'Content' },
  { id: 'images', label: 'Images', href: '/dashboard/images', group: 'Content' },
  { id: 'captions', label: 'Captions', href: '/dashboard/captions', group: 'Content' },
  { id: 'caption-requests', label: 'Requests', href: '/dashboard/caption-requests', group: 'Content' },
  { id: 'caption-examples', label: 'Examples', href: '/dashboard/caption-examples', group: 'Content' },
  { id: 'humor-flavors', label: 'Flavors', href: '/dashboard/humor-flavors', group: 'Humor' },
  { id: 'humor-steps', label: 'Steps', href: '/dashboard/humor-steps', group: 'Humor' },
  { id: 'humor-mix', label: 'Mix', href: '/dashboard/humor-mix', group: 'Humor' },
  { id: 'terms', label: 'Terms', href: '/dashboard/terms', group: 'Humor' },
  { id: 'llm-models', label: 'Models', href: '/dashboard/llm-models', group: 'LLM' },
  { id: 'llm-providers', label: 'Providers', href: '/dashboard/llm-providers', group: 'LLM' },
  { id: 'llm-chains', label: 'Chains', href: '/dashboard/llm-chains', group: 'LLM' },
  { id: 'llm-responses', label: 'Responses', href: '/dashboard/llm-responses', group: 'LLM' },
  { id: 'allowed-domains', label: 'Domains', href: '/dashboard/allowed-domains', group: 'Access' },
  { id: 'whitelist-emails', label: 'Whitelist', href: '/dashboard/whitelist-emails', group: 'Access' },
] as const;

export function AdminLayout({ children, currentPage, userEmail }: Props) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
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

      {/* Simple horizontal scrollable navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-slate-700">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  currentPage === item.id
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
