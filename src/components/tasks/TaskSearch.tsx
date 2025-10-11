/**
 * Task Search Component
 * Provides debounced search functionality for filtering tasks
 */
import React, { useState, useEffect, useCallback } from "react";
import { Input, Button } from "@/components/ui";
import { FaSearch, FaTimes } from "../../utils/iconImport";

interface TaskSearchProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const TaskSearch: React.FC<TaskSearchProps> = ({
  onSearchChange,
  placeholder = "Search tasks...",
  debounceMs = 300,
}) => {
  const [searchValue, setSearchValue] = useState("");

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearchChange]);

  const handleClear = useCallback(() => {
    setSearchValue("");
  }, []);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <FaSearch />
      </div>
      <Input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 bg-white/5 border border-white/10 rounded-lg py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
      />
      {searchValue && (
        <Button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 bg-transparent border-none"
          aria-label="Clear search"
        >
          <FaTimes />
        </Button>
      )}
    </div>
  );
};
