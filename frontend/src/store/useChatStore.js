import { create } from "zustand";

export const useChatStore = create((set) => ({
  messages: [],
  activeQuery: null,
  setActiveQuery: (query) => set({ activeQuery: query }),
  viewMode: 'graph', // 'graph' | 'table'
  tableData: [],
  isLoading: false,

  addMessage: (role, text, meta = {}) =>
    set((state) => ({
      messages: [...state.messages, { role, text, ...meta }],
    })),

  setViewMode: (mode) => set({ viewMode: mode }),
  setTableData: (data) => set({ 
    tableData: data ? data.map((row, idx) => ({ ...row, _rowId: `row-${Date.now()}-${idx}` })) : [],
    currentPage: 1
  }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  currentPage: 1,
  itemsPerPage: 300,
  setCurrentPage: (page) => set({ currentPage: page }),
  
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  saveToHistory: (query, data) => set((state) => {
     const newItem = { id: Date.now(), query, timestamp: new Date().toISOString(), data };
     const filtered = state.searchHistory.filter(h => h.query !== query);
     const newHistory = [newItem, ...filtered].slice(0, 8); // Keep last 8 searches
     try { localStorage.setItem('searchHistory', JSON.stringify(newHistory)); } catch(e) {}
     return { searchHistory: newHistory };
  }),
  selectedTableRows: [],

  toggleTableRow: (rowId) => set((state) => {
    const isSelected = state.selectedTableRows.includes(rowId);
    return {
      selectedTableRows: isSelected 
        ? state.selectedTableRows.filter(r => r !== rowId)
        : [...state.selectedTableRows, rowId]
    };
  }),

  clearSelectedTableRows: () => set({ selectedTableRows: [] }),

  clearMessages: () => set({ messages: [] }),
}));