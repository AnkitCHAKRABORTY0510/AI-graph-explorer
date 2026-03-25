import { create } from 'zustand';

export const useGraphStore = create((set) => ({
  nodes: [],
  edges: [],
  focusedNode: null,
  setGraph: (nodes, edges) => set({ nodes, edges, focusedNode: null }),
  setFocusedNode: (node) => set({ focusedNode: node }),
}));
