import React, { useEffect, useState, useRef } from 'react';
import { ReactFlow, Background, Controls, MarkerType, Handle, Position, useNodesState, useEdgesState } from '@xyflow/react';
import * as d3 from 'd3-force';
import { fetchSchema } from '../services/api';
import '@xyflow/react/dist/style.css';

// Custom Node to display a Database Table and its columns
const SchemaTableNode = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-64 overflow-hidden text-left cursor-grab active:cursor-grabbing font-sans">
      {/* Target handle for incoming relationships */}
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-500 border-none opacity-0" />
      
      {/* Table Header */}
      <div className="bg-[#242424] px-4 py-2.5 flex items-center justify-between">
        <h3 className="font-bold text-[13px] text-white tracking-wide truncate">
          {data.tableName}
        </h3>
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></div>
      </div>
      
      {/* Columns List */}
      <div className="p-2 max-h-[250px] overflow-y-auto bg-gray-50/50">
        <ul className="space-y-1">
          {data.columns.map((col, idx) => {
            if (col === 'raw') return null; // Skip raw metadata column
            const isPrimaryKey = idx === 0; // Rough assumption for visual
            return (
              <li key={col} className={`flex items-center text-[11px] px-2 py-1.5 rounded-md ${isPrimaryKey ? 'bg-blue-50/80 text-blue-800 font-semibold border border-blue-100/50' : 'text-gray-600 font-medium'}`}>
                {isPrimaryKey && <span className="mr-1.5 text-blue-500">❖</span>}
                {!isPrimaryKey && <span className="mr-1.5 text-gray-300">•</span>}
                {col}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Source handle for outgoing relationships */}
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-500 border-none opacity-0" />
    </div>
  );
};

const nodeTypes = {
  schemaTable: SchemaTableNode
};

export default function SchemaCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const simulationRef = useRef(null);
  const d3NodesRef = useRef([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const schema = await fetchSchema();
        
        // 1. Build Nodes
        const rfNodes = Object.entries(schema.tables).map(([tableName, columns]) => ({
          id: tableName,
          type: 'schemaTable',
          data: { tableName, columns },
          position: { x: Math.random() * 800 - 400, y: Math.random() * 800 - 400 },
          dragHandle: '.bg-\\[\\#242424\\]' // Drag by header
        }));

        // 2. Build Edges
        const rfEdges = schema.relationships.map((rel, idx) => ({
          id: `rel-${idx}`,
          source: rel.from,
          target: rel.to,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          label: rel.type,
          labelStyle: { fill: '#64748b', fontSize: 9, fontWeight: 600 },
          labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9, rx: 4 },
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);

        // 3. Initialize D3 Physics for initial layout
        const d3Nodes = rfNodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
        const d3Edges = rfEdges.map(e => ({ source: e.source, target: e.target, id: e.id }));
        d3NodesRef.current = d3Nodes;

        if (simulationRef.current) simulationRef.current.stop();

        const simulation = d3.forceSimulation(d3Nodes)
          .force('charge', d3.forceManyBody().strength(-6000)) 
          .force('link', d3.forceLink(d3Edges).id(d => d.id).distance(450)) 
          .force('x', d3.forceX(0).strength(0.01))
          .force('y', d3.forceY(0).strength(0.01))
          .force('collide', d3.forceCollide().radius(220).iterations(3))      
          .alpha(1)
          .restart();

        simulation.on('tick', () => {
          setNodes(nds => nds.map(n => {
            const d3n = d3Nodes.find(d => d.id === n.id);
            if(!d3n) return n;
            return { ...n, position: { x: d3n.x, y: d3n.y } };
          }));
        });

        simulationRef.current = simulation;
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load schema. Please restart your backend server so it registers the new /schema endpoint!");
      } finally {
        setLoading(false);
      }
    }
    
    load();
    return () => { if (simulationRef.current) simulationRef.current.stop(); };
  }, [setNodes, setEdges]);

  const onNodeDragStart = (_, node) => {
    if (!simulationRef.current || !d3NodesRef.current) return;
    const d3n = d3NodesRef.current.find(d => d.id === node.id);
    if (d3n) { d3n.fx = d3n.x; d3n.fy = d3n.y; }
  };

  const onNodeDrag = (_, node) => {
    if (!simulationRef.current || !d3NodesRef.current) return;
    const d3n = d3NodesRef.current.find(d => d.id === node.id);
    if (d3n) {
      d3n.fx = node.position.x;
      d3n.fy = node.position.y;
      simulationRef.current.alphaTarget(0.3).restart(); 
    }
  };

  const onNodeDragStop = (_, node) => {
    if (!simulationRef.current || !d3NodesRef.current) return;
    const d3n = d3NodesRef.current.find(d => d.id === node.id);
    if (d3n) {
      d3n.fx = null; d3n.fy = null;
      simulationRef.current.alphaTarget(0); 
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500 font-medium bg-[#fafafa]">Loading database schema...</div>;
  }

  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500 font-medium bg-[#fafafa] px-8 text-center">{error}</div>;
  }

  return (
    <div className="w-full h-full relative bg-[#fafafa]">
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <div className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-md text-[11px] font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
          Database Schema Explorer
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
      >
        <Background color="#eaeaea" gap={20} size={1} />
        <Controls className="fill-gray-600 [&>button]:bg-white [&>button]:border-gray-200 [&>button]:text-gray-600 hover:[&>button]:bg-gray-50 shadow-sm rounded-md" />
      </ReactFlow>
    </div>
  );
}
