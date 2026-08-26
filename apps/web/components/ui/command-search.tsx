"use client";

import { type FormEvent, useState } from "react";

interface CommandSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function CommandSearch({
  onSearch,
  placeholder = "query dependency or protocol (e.g. sequencer:base, aave-v3)...",
  className = "",
}: CommandSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center w-full font-mono text-sm border border-[#1f521f] bg-[#0a0a0a] px-3 py-2 ${className}`}
    >
      <span className="text-[#33ff00] font-bold mr-2 select-none">&gt;</span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[#33ff00] placeholder-[#79a879]/50 focus:outline-none"
      />
      <button
        type="submit"
        className="text-xs uppercase text-[#79a879] hover:text-[#33ff00] ml-2 px-2 py-0.5 border border-[#1f521f] hover:border-[#33ff00]"
      >
        [EXEC]
      </button>
    </form>
  );
}
