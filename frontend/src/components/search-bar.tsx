"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon, X } from 'lucide-react';
import { Command } from '@/components/ui/command';
import { getSearchSuggestions } from '@/lib/api';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  showSuggestions?: boolean;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search posts...", 
  className = "", 
  initialValue = "",
  showSuggestions = true 
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialValue || searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update search query if URL changes (only when not using onSearch callback)
    if (!onSearch) {
      setSearchQuery(searchParams.get('q') || '');
    }
  }, [searchParams, onSearch]);

  useEffect(() => {
    // Update search query if initialValue changes (for admin panel)
    if (initialValue !== undefined) {
      setSearchQuery(initialValue);
    }
  }, [initialValue]);

  // Debounced suggestions fetching
  useEffect(() => {
    if (!showSuggestions || !searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const newSuggestions = await getSearchSuggestions(searchQuery, 5);
        setSuggestions(newSuggestions);
        setShowSuggestionsList(newSuggestions.length > 0);
      } catch (error) {
        console.warn('Failed to fetch suggestions:', error);
        setSuggestions([]);
        setShowSuggestionsList(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setShowSuggestionsList(false);
    
    if (onSearch) {
      // Custom callback (for admin panel)
      onSearch(query);
    } else {
      // Default behavior - navigate to blog with search query (for blog page)
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

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestionsList(false);
    
    if (onSearch) {
      onSearch(suggestion);
    } else {
      router.push(`/blog?q=${encodeURIComponent(suggestion)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestionsList(false);
    if (onSearch) {
      onSearch('');
    } else {
      router.push('/blog');
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-md ${className}`}>
      <form onSubmit={handleSubmit}>
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
                onFocus={handleInputFocus}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </Command>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestionsList && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors focus:bg-muted focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <SearchIcon className="size-3 opacity-50" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
