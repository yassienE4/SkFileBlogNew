"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from 'lucide-react';
import { Command } from '@/components/ui/command';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder = "Search posts...", className = "" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    // Update search query if URL changes
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (onSearch) {
      onSearch(query);
    } else {
      // Default behavior - navigate to blog with search query
      if (query) {
        router.push(`/blog?q=${encodeURIComponent(query)}`);
      } else {
        router.push('/blog');
      }
    }
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-md ${className}`}>
      <div className="relative">
        <Command className="border rounded-lg shadow-sm bg-background">
          <div className="flex items-center gap-2 border-0 px-3 py-2">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  router.push('/blog');
                }}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm px-2"
              >
                Clear
              </button>
            )}
          </div>
        </Command>
      </div>
    </form>
  );
}
