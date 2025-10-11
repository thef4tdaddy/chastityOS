/**
 * Hook for task filtering, pagination, and categorization
 */
import { useMemo, useState } from "react";
import type { Task } from "../types";

interface UseTaskFiltersProps {
  tasks: Task[];
  itemsPerPage?: number;
}

export const useTaskFilters = ({
  tasks,
  itemsPerPage = 20,
}: UseTaskFiltersProps) => {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Categorize tasks
  const activeTasks = useMemo(
    () =>
      tasks.filter((task) => ["pending", "submitted"].includes(task.status)),
    [tasks],
  );

  const archivedTasks = useMemo(
    () =>
      tasks.filter((task) =>
        ["approved", "rejected", "completed", "cancelled"].includes(
          task.status,
        ),
      ),
    [tasks],
  );

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    const tasksToFilter = activeTab === "active" ? activeTasks : archivedTasks;

    if (!searchQuery.trim()) {
      return tasksToFilter;
    }

    const query = searchQuery.toLowerCase();
    return tasksToFilter.filter(
      (task) =>
        task.text.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category?.toLowerCase().includes(query),
    );
  }, [activeTasks, archivedTasks, activeTab, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Handlers that reset pagination
  const handleTabChange = (tab: "active" | "archived") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  return {
    activeTab,
    activeTasks,
    archivedTasks,
    filteredTasks,
    paginatedTasks,
    searchQuery,
    currentPage,
    totalPages,
    setActiveTab: handleTabChange,
    setSearchQuery: handleSearchChange,
    setCurrentPage: handlePageChange,
  };
};
