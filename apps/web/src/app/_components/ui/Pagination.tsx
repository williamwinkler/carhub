"use client";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-4">
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-all duration-200"
      >
        Previous
      </button>

      <span className="text-slate-400">
        Page {currentPage + 1} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-all duration-200"
      >
        Next
      </button>
    </div>
  );
}
