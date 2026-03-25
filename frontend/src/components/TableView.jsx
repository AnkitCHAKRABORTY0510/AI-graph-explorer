import React, { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';

export default function TableView() {
  const { tableData, selectedTableRows, toggleTableRow, clearSelectedTableRows, currentPage, setCurrentPage, itemsPerPage } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Reset to page 1 when search changes
    setCurrentPage(1);
    clearSelectedTableRows();
  }, [searchQuery, clearSelectedTableRows, setCurrentPage]);

  if (!tableData || tableData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" />
          </svg>
          <p>No table data available</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(tableData[0] || {}).filter(col => col !== '_rowId');

  // 1. Perform Global Text Filter
  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const lowerQuery = searchQuery.toLowerCase();
    return tableData.filter(row => 
      columns.some(col => String(row[col]).toLowerCase().includes(lowerQuery))
    );
  }, [tableData, searchQuery, columns]);

  // 2. Perform Pagination Logic on Filtered Subset
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const handleSelectAllCurrentPage = (e) => {
    const isChecked = e.target.checked;
    currentData.forEach(row => {
       const rowId = row._rowId;
       const isSelected = selectedTableRows.includes(rowId);
       if (isChecked && !isSelected) toggleTableRow(rowId);
       else if (!isChecked && isSelected) toggleTableRow(rowId);
    });
  };

  const isAllCurrentChecked = currentData.length > 0 && currentData.every(row => selectedTableRows.includes(row._rowId));

  return (
    <div className="flex-1 flex flex-col bg-white relative h-full">
      {/* Search Bar Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-end bg-white shrink-0">
         <div className="relative w-72">
           <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           <input
             type="text"
             placeholder="Search all records..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
           />
         </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto bg-white relative">
        <div className="min-w-max">
          <table className="divide-y divide-gray-200 text-sm text-left w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky top-0 z-20 bg-gray-50 px-6 py-4 border-b border-gray-200 w-4 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={isAllCurrentChecked} 
                      onChange={handleSelectAllCurrentPage}
                      className="cursor-pointer rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]" 
                    />
                  </div>
                </th>
                {columns.map((col) => (
                  <th 
                    key={col} 
                    className="sticky top-0 z-20 bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider shadow-[0_1px_0_0_rgba(0,0,0,0.05)] text-xs whitespace-nowrap"
                  >
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-400 font-medium">
                    {searchQuery ? `No results found for "${searchQuery}"` : "No results found matching your search."}
                  </td>
                </tr>
              ) : (
                currentData.map((row, idx) => {
                  const rowId = row._rowId;
                  const isSelected = selectedTableRows.includes(rowId);
                  return (
                    <tr key={rowId || idx} onClick={() => toggleTableRow(rowId)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 hover:bg-blue-100/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 border-b border-gray-50 w-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleTableRow(rowId)} 
                            className="cursor-pointer rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]" 
                          />
                        </div>
                      </td>
                      {columns.map((col) => (
                        <td key={col} className="px-6 py-4 text-gray-600 whitespace-nowrap border-b border-gray-50">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="h-16 border-t border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="text-[11px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-3">
          <span>Show {currentPage} / {totalPages} pages</span>
          <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
          <span>{filteredData.length} total records</span>
          {searchQuery && <span className="text-gray-300"> (filtered from {tableData.length})</span>}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Previous
            </button>
            <span className="text-[13px] text-gray-600 font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
