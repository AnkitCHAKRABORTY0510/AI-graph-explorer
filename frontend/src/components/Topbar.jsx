import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGraphStore } from '../store/useGraphStore';

export default function Topbar() {
  const { viewMode, setViewMode, searchHistory, setTableData, messages, activeQuery, setActiveQuery } = useChatStore();
  const { setGraph } = useGraphStore();
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const restoreSearch = (item) => {
    if (item.data?.nodes && item.data?.edges) {
      setGraph(item.data.nodes, item.data.edges);
      setViewMode('graph');
    }
    if (item.data?.tableData) {
      setTableData(item.data.tableData);
      if (!item.data?.nodes) setViewMode('table');
    }
    setActiveQuery(item.query);
    setShowHistory(false);
  };

  return (
    <div className="h-[60px] flex items-center justify-between px-4 bg-white border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-3 w-1/3 relative" ref={dropdownRef}>
        {/* History Toggle Icon */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors relative"
          title="Search History"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          {searchHistory.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1a1a1a] rounded-full text-white text-[8px] font-bold flex items-center justify-center">{searchHistory.length}</span>
          )}
        </button>

        {/* History Dropdown */}
        {showHistory && (
          <div className="absolute top-10 left-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Recent Searches</span>
              <span className="text-[10px] text-gray-400">{searchHistory.length} saved</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {searchHistory.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-gray-400">No search history yet</div>
              ) : (
                searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => restoreSearch(item)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none flex items-start gap-3"
                  >
                    <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-800 truncate">{item.query}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(item.timestamp).toLocaleString()}
                        {item.data?.nodes && <span className="ml-2 text-gray-700 font-bold tracking-tighter uppercase text-[8px]">• {item.data.nodes.length} nodes</span>}
                        {item.data?.tableData && <span className="ml-2 text-gray-700 font-bold tracking-tighter uppercase text-[8px]">• {item.data.tableData.length} rows</span>}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="text-[13px] text-gray-400 font-medium truncate max-w-[550px]">
          {(() => { 
            if (activeQuery) {
              return <><span>Query</span><span className="px-1 text-gray-300">/</span><span className="font-bold text-gray-900">{activeQuery}</span></>;
            }
            const last = [...(messages || [])].reverse().find(m => m.role === 'user'); 
            return last ? <><span>Query</span><span className="px-1 text-gray-300">/</span><span className="font-bold text-gray-900">{last.text}</span></> : null; 
          })()}
        </div>
      </div>

      <div className="flex justify-center ">
        <div className="bg-gray-50 p-1 rounded-md flex gap-1 shadow-inner border border-gray-100/50">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${viewMode === 'graph' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Graph
          </button>
          <button
            onClick={() => setViewMode('schema')}
            className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${viewMode === 'schema' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Schema
          </button>
        </div>
      </div>


    </div>
  );
}