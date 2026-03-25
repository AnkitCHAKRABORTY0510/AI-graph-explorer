import { useEffect, useRef, useMemo, useCallback, useState, memo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, useNodesState, useEdgesState } from '@xyflow/react';
import * as d3 from 'd3-force';
import { useGraphStore } from '../store/useGraphStore';
import { useChatStore } from '../store/useChatStore';
import '@xyflow/react/dist/style.css';

// Custom Node matching the tiny circle style
const Neo4jNode = ({ data, selected }) => {
  return (
    <div className="relative flex justify-center items-center">
      <div 
        className={`rounded-full transition-shadow cursor-grab active:cursor-grabbing ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        style={{
          width: 14,
          height: 14,
          backgroundColor: data.color || '#3b82f6',
          border: '1.5px solid rgba(0,0,0,0.1)',
        }}
      />
      
      {selected && (
        <div className="absolute top-4 left-4 w-64 bg-white shadow-2xl rounded-xl p-4 border border-gray-100 z-50 text-left cursor-default">
          <h3 className="font-bold text-[14px] text-gray-900 mb-2.5">
            {data.typeLabel || 'Node'}
          </h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 text-[11px] text-gray-600">
            {Object.entries(data).map(([k, v]) => {
              if (k === 'color' || k === 'typeLabel' || k === 'label') return null;
              return (
                <div key={k} className="flex flex-col mb-1.5">
                  <span className="font-medium text-gray-500 inline-block capitalize mb-0.5">{k.replace(/_/g, '')}:</span>
                  <span className="text-gray-800 break-all">{String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1  }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1 }} />
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1  }} />
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1 }} />
    </div>
  );
};

const nodeTypes = {
  neo4j: Neo4jNode
};

/**
 * GraphCanvas Component
 * Renders the interactive node/edge visualization map using React Flow and D3 Force directed layouts.
 * Highly optimized with React.memo to prevent expensive re-rendering of large SVG DOMs.
 */
export default memo(function GraphCanvas() {
  const { nodes: storeNodes, edges: storeEdges, focusedNode, setFocusedNode } = useGraphStore();
  const { tableData, currentPage, setCurrentPage, itemsPerPage } = useChatStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  
  const simulationRef = useRef(null);
  const d3NodesRef = useRef([]);

  // 1. Computed Filtered State
  const { rfNodes, rfEdges, isAdaptiveMode } = useMemo(() => {
    if (!storeNodes || !storeNodes.length) return { rfNodes: [], rfEdges: [], isAdaptiveMode: false };

    const totalRowsCount = tableData?.length || 0;
    const itemsPerGraphLoad = 3000; 
    const isAdaptive = totalRowsCount > 0 && totalRowsCount <= itemsPerGraphLoad;

    let validNodeIds = new Set();
    
    if (isAdaptive) {
      tableData.forEach(row => {
        Object.keys(row).filter(k => k !== '_rowId').forEach(k => {
          validNodeIds.add(String(row[k]));
        });
      });
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const currentTableData = (tableData || []).slice(startIndex, startIndex + itemsPerPage);
      currentTableData.forEach(row => {
        Object.keys(row).filter(k => k !== '_rowId').forEach(k => {
          validNodeIds.add(String(row[k]));
        });
      });
    }

    const tableMatchedNodes = storeNodes.filter(n => {
      const checkLabel = n.data?.label ? String(n.data.label) : null;
      const checkId = n.data?.id ? String(n.data.id) : null;
      const originalId = n.data?.originalId ? String(n.data.originalId) : null;
      return (checkLabel && validNodeIds.has(checkLabel)) || (checkId && validNodeIds.has(checkId)) || (originalId && validNodeIds.has(originalId));
    });

    const tableNodeIds = new Set(tableMatchedNodes.map(n => n.id));
    const connectorNodeIds = new Set();
    storeEdges.forEach(e => {
        if (tableNodeIds.has(e.source) || tableNodeIds.has(e.target)) {
            if (isAdaptive) {
                connectorNodeIds.add(e.source);
                connectorNodeIds.add(e.target);
            }
        }
    });

    const finalFilteredNodes = storeNodes.filter(n => tableNodeIds.has(n.id) || connectorNodeIds.has(n.id));
    const finalFilteredIds = new Set(finalFilteredNodes.map(n => n.id));

    const outNodes = finalFilteredNodes.map(n => ({
      ...n,
      type: 'neo4j',
      data: { ...n.data, color: n.color },
      position: { x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600 },
      dragHandle: '.rounded-full'
    }));

    const outEdges = storeEdges
      .filter(e => finalFilteredIds.has(e.source) && finalFilteredIds.has(e.target))
      .map(e => ({
        ...e,
        type: 'straight',
        style: { stroke: 'rgba(200, 200, 200, 0.4)', strokeWidth: 1.2 },
        animated: false,
        labelStyle: { fill: '#aaa', fontSize: 8, fontWeight: 500, pointerEvents: 'none' },
        labelBgStyle: { fill: 'transparent' },
      }));

    return { rfNodes: outNodes, rfEdges: outEdges, isAdaptiveMode: isAdaptive };
  }, [storeNodes, storeEdges, tableData, currentPage, itemsPerPage]);

  // 2. Physics Simulation Initialization (STATIC-FIRST)
  useEffect(() => {
    if (!rfNodes.length) {
      if (simulationRef.current) simulationRef.current.stop();
      d3NodesRef.current = [];
      setNodes([]);
      setEdges([]);
      return;
    }

    // A. Setup d3 layout data
    const d3Nodes = rfNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
    const d3Edges = rfEdges.map(e => ({ source: e.source, target: e.target }));
    const nodeLookup = new Map(d3Nodes.map(n => [n.id, n]));
    d3NodesRef.current = d3Nodes;

    if (simulationRef.current) simulationRef.current.stop();

    const simulation = d3.forceSimulation(d3Nodes)
      .force('link', d3.forceLink(d3Edges).id(d => d.id).distance(150).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-800).distanceMax(1200))
      .force('collide', d3.forceCollide().radius(80).strength(1))
      .force('center', d3.forceCenter(0, 0))
      .alphaDecay(0.08); // Faster decay

    // B. PRE-CALCULATE (Instant Stabilization)
    // Run 300 ticks BEFORE the nodes ever hit the React state
    for (let i = 0; i < 300; ++i) simulation.tick();

    // C. Initialize React Nodes with stable positions
    const stableNodes = rfNodes.map(n => {
        const d3n = nodeLookup.get(n.id);
        return { ...n, position: { x: d3n.x, y: d3n.y } };
    });
    
    setNodes(stableNodes);
    setEdges(rfEdges);

    // D. Define Tick listener (disabled by default except during interaction)
    simulation.on('tick', () => {
        setNodes(nds => {
          // Only update if interaction is active OR alpha is high
          if (!nds.length || nds.length !== rfNodes.length) return nds;
          return nds.map(n => {
            const d3n = nodeLookup.get(n.id);
            if(!d3n) return n;
            return { ...n, position: { x: d3n.x, y: d3n.y } };
          });
        });
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      d3NodesRef.current = [];
    };
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  // Drag Handlers (START SIMULATION ON INTERACTION)
  const onNodeDragStart = useCallback((_, node) => {
    if (!simulationRef.current || !d3NodesRef.current) return;
    const d3n = d3NodesRef.current.find(d => d.id === node.id);
    if (d3n) {
      d3n.fx = d3n.x;
      d3n.fy = d3n.y;
      setIsSimulationActive(true);
      simulationRef.current.alphaTarget(0.3).restart(); 
    }
  }, []);

  const onNodeDrag = useCallback((_, node) => {
    if (!simulationRef.current || !d3NodesRef.current) return;
    const d3n = d3NodesRef.current.find(d => d.id === node.id);
    if (d3n) {
      d3n.fx = node.position.x;
      d3n.fy = node.position.y;
    }
  }, []);

  const onNodeDragStop = useCallback((_, node) => {
    if (!simulationRef.current || !d3NodesRef.current) return;
    const d3n = d3NodesRef.current.find(d => d.id === node.id);
    if (d3n) {
      d3n.fx = null; 
      d3n.fy = null;
      simulationRef.current.alphaTarget(0); // Let it settle
      
      // Stop React updates once it's near equilibrium
      setTimeout(() => {
          setIsSimulationActive(false);
      }, 500);
    }
  }, []);

  // --- Highlighting Logic ---
  const { selectedTableRows } = useChatStore();
  const focusedId = focusedNode?.id;
  
  const connectedNodeIds = useMemo(() => {
    const set = new Set();
    if (focusedId) {
      set.add(focusedId);
      edges.forEach(e => {
        if (e.source === focusedId) set.add(e.target);
        if (e.target === focusedId) set.add(e.source);
      });
    }
    return set;
  }, [focusedId, edges]);

  const selectedTargetIds = useMemo(() => {
    const set = new Set();
    if (selectedTableRows && selectedTableRows.length > 0) {
      selectedTableRows.forEach(rowId => {
        const row = tableData.find(r => r._rowId === rowId);
        if (row) {
          Object.keys(row).filter(k => k !== '_rowId').forEach(k => set.add(String(row[k])));
        }
      });
    }
    return set;
  }, [selectedTableRows, tableData]);

  const isFilterActive = focusedId || selectedTargetIds.size > 0;

  const displayNodes = useMemo(() => nodes.map(n => {
    let isHighlighted = true;
    if (isFilterActive) {
       const isFocused = focusedId ? connectedNodeIds.has(n.id) : false;
       const isSelectedInTable = selectedTargetIds.size > 0 
           ? (selectedTargetIds.has(String(n.data?.label)) || selectedTargetIds.has(String(n.id)) || selectedTargetIds.has(String(n.data?.originalId)))
           : false;
       isHighlighted = isFocused || isSelectedInTable;
    }
    return {
      ...n,
      style: { ...n.style, opacity: isHighlighted ? 1 : 0.15, transition: 'opacity 0.3s' }
    };
  }), [nodes, isFilterActive, focusedId, connectedNodeIds, selectedTargetIds]);

  const displayEdges = useMemo(() => edges.map(e => {
    let isHighlighted = true;
    let isDirect = false;

    if (isFilterActive) {
       const isFocusedHighlight = focusedId ? (e.source === focusedId || e.target === focusedId) : false;
       
       let isSelectedHighlight = false;
       if (selectedTargetIds.size > 0) {
           const sourceNode = nodes.find(n => n.id === e.source);
           const targetNode = nodes.find(n => n.id === e.target);
           if (sourceNode && targetNode) {
               const sourceInTable = selectedTargetIds.has(String(sourceNode.data?.label)) || selectedTargetIds.has(String(sourceNode.id));
               const targetInTable = selectedTargetIds.has(String(targetNode.data?.label)) || selectedTargetIds.has(String(targetNode.id));
               isSelectedHighlight = sourceInTable && targetInTable;
           }
       }
       
       isHighlighted = isFocusedHighlight || isSelectedHighlight;
       isDirect = focusedId ? isFocusedHighlight : isSelectedHighlight;
    }

    return {
      ...e,
      style: { 
        ...e.style,
        stroke: isDirect ? '#3b82f6' : '#ebf0f7',
        strokeWidth: isDirect ? 2.5 : 1.5,
        opacity: isHighlighted ? 1 : 0.15,
        transition: 'all 0.3s'
      },
      animated: isDirect,
      labelStyle: { ...e.labelStyle, fill: isHighlighted ? '#aaa' : 'transparent' }
    };
  }), [edges, nodes, isFilterActive, focusedId, selectedTargetIds]);

  return (
    <div className="w-full h-full relative bg-[#fafafa]">
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium text-center px-8">
           {storeNodes && storeNodes.length > 0 ? "No graph data matches this view" : "Enter a query in the chat to generate a graph"}
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setFocusedNode(node)}
            onPaneClick={() => setFocusedNode(null)}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.05}
          >
            <Background color="#eaeaea" gap={20} size={1} />
            <Controls className="fill-gray-600 [&>button]:bg-white [&>button]:border-gray-200 [&>button]:text-gray-600 hover:[&>button]:bg-gray-50 shadow-sm rounded-md" />
          </ReactFlow>
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl px-5 py-2.5 z-50">
            {isAdaptiveMode ? (
              <div className="flex flex-col items-center min-w-[200px]">
                <span className="text-xs font-black text-gray-800 tabular-nums">
                   {nodes.length} NODES <span className="text-gray-400 mx-1">LOADED INSIGHTS</span>
                </span>
              </div>
            ) : (() => {
              const totalPages = Math.ceil((tableData?.length || 0) / itemsPerPage);
              return (
                <>
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex flex-col items-center min-w-[120px]">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-0.5">
                      PAGINATED VIEW
                    </span>
                    <span className="text-xs font-black text-gray-800 tabular-nums">
                      PAGE {currentPage} <span className="text-gray-400 mx-1">/</span> {totalPages}
                    </span>
                  </div>

                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
});