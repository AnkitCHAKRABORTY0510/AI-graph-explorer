import { useState, useCallback, useEffect, useRef } from "react";
import Topbar from "./components/Topbar";
import GraphCanvas from "./components/GraphCanvas";
import Sidebar from "./components/Sidebar";
import TableView from "./components/TableView";
import SchemaCanvas from "./components/SchemaCanvas";
import { useChatStore } from "./store/useChatStore";

export default function App() {
  const { viewMode } = useChatStore();
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(Math.max(280, Math.min(700, newWidth)));
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex bg-[#1c1c1c] p-2 md:p-3 overflow-hidden font-sans text-gray-900 gap-1 md:gap-1">
      {/* Main App Container (Table/Graph + Topbar) */}
      <div className="flex-1 flex flex-col bg-white rounded-[10px] overflow-hidden shadow-2xl relative">
        <Topbar />
        <div className="flex-1 overflow-hidden relative bg-gray-50/50">
          {viewMode === 'schema' ? (
            <SchemaCanvas />
          ) : viewMode === 'table' ? (
            <TableView />
          ) : (
            <GraphCanvas />
          )}
        </div>
      </div>

      {/* Draggable Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-[2px] md:w-[4px] shrink-0 cursor-col-resize bg-[#1c1c1c] hover:bg-blue-400 active:bg-blue-500 transition-colors z-20 flex items-center justify-center group"
        title="Drag to resize"
      >
        <div className="w-px h-8 bg-gray-600 group-hover:bg-white rounded-full opacity-50"></div>
      </div>

      {/* Right Sidebar Panel (A separate bounded box) */}
      <div style={{ width: sidebarWidth }} className="shrink-0 flex flex-col bg-white rounded-[10px] shadow-2xl overflow-hidden border border-gray-100">
        <Sidebar />
      </div>
    </div>
  );
}