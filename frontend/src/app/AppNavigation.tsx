'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/orders', label: 'Orders' },
  { href: '/clients', label: 'Clients' },
  { href: '/menu-items', label: 'Menu Items' },
  { href: '/categories', label: 'Categories' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavigation() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Backdrop overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side drawer — mobile only */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[linear-gradient(180deg,#fff8ef,#ffe4c7)] shadow-[4px_0_32px_-8px_rgba(120,53,15,0.25)] transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between border-b border-orange-200/80 px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setDrawerOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-sm font-black text-orange-800">
              CT
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-slate-950">
                CaterTrack
              </p>
              <p className="text-xs text-stone-500">Catering dashboard</p>
            </div>
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200/80 bg-white/70 text-stone-500 transition hover:bg-orange-50 hover:text-orange-800"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-orange-300 bg-orange-100 text-orange-900 shadow-[0_4px_12px_-6px_rgba(180,83,9,0.35)]'
                    : 'border-orange-200/60 bg-white/70 text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Menu button row — mobile only */}
      <div className="px-4 pt-4 lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200/80 bg-white/85 text-orange-700 shadow-[0_4px_18px_-6px_rgba(120,53,15,0.18)] backdrop-blur-md transition hover:bg-orange-50 hover:text-orange-900"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="10.5" x2="13" y2="10.5" />
            <line x1="3" y1="15" x2="9" y2="15" />
          </svg>
        </button>
      </div>

      {/* Top header bar — desktop only */}
      <header className="sticky top-0 z-30 hidden px-4 pt-4 sm:px-8 lg:block lg:px-12">
        <div className="mx-auto max-w-7xl rounded-3xl border border-orange-200/80 bg-[linear-gradient(180deg,rgba(255,252,248,0.72),rgba(255,243,227,0.88))] shadow-[0_18px_50px_-34px_rgba(120,53,15,0.32)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-sm font-black text-orange-800">
                CT
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[0.16em] text-slate-950">
                  CaterTrack
                </p>
                <p className="text-xs text-stone-500">Catering dashboard</p>
              </div>
            </Link>

            <nav className="flex gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-orange-300 bg-orange-100 text-orange-900 shadow-[0_12px_24px_-20px_rgba(180,83,9,0.45)]'
                        : 'border-orange-200/80 bg-white/70 text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
