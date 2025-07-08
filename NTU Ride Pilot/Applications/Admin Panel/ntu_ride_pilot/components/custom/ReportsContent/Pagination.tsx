import React from "react";

interface PaginationProps {
  currentLoadedCount: number;
  totalRows: number;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  onRowsPerPageChange: (rows: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isNextDisabled: boolean;
  isPrevDisabled: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentLoadedCount,
  totalRows,
  rowsPerPage,
  rowsPerPageOptions,
  onRowsPerPageChange,
  onNext,
  onPrev,
  isNextDisabled,
  isPrevDisabled,
}) => {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const currentPage = Math.ceil(currentLoadedCount / rowsPerPage);

  return (
    <div className="flex items-center justify-between m-6">
      <div className="flex items-center">
        <label htmlFor="rowsPerPage" className="mr-2 text-sm text-gray-700">
          Rows per page:
        </label>
        <select
          id="rowsPerPage"
          className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        >
          {rowsPerPageOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <button
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
          onClick={onPrev}
          disabled={isPrevDisabled}
        >
          &lt;
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className="px-3 py-1 border rounded-md hover:bg-gray-100"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
