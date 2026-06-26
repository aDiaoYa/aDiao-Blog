"use client";

import { createContext, useContext, useCallback, useState } from "react";

interface SearchContextValue {
  openSearch: () => void;
  isOpen: boolean;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  openSearch: () => {},
  isOpen: false,
  closeSearch: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);

  return (
    <SearchContext.Provider value={{ openSearch, isOpen, closeSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
