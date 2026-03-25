import { useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useGraphStore } from '../store/useGraphStore';
import { interpretQuery, executeGraphPlan } from '../services/api';

/**
 * Custom hook to manage the AI chat engine execution lifecycle including
 * request cancellation, retries, loading states, and state population.
 */
export function useChatEngine() {
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState("few");
  const [loading, setLoading] = useState(false);
  
  const { messages, addMessage, setViewMode, setTableData, saveToHistory, setActiveQuery } = useChatStore();
  const { setGraph } = useGraphStore();
  
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  /**
   * Primary orchestrator that dispatches natural language queries to the AI interpret engine,
   * evaluates the SQL payload, executes graphs, and performs silent retries upon SQL errors.
   * 
   * @param {string|null} overrideQuery - Provide a predefined prompt to bypass user input state
   * @param {Object|null} retryContext - Passes error footprint when recursively retrying a failed query
   */
  const handleSend = async (overrideQuery = null, retryContext = null) => {
    const queryToUse = overrideQuery || input;
    if (!queryToUse.trim() || (loading && !retryContext)) return;
    
    // Only add user message and update standard state on distinct runs (not retries)
    if (!retryContext) {
      addMessage("user", queryToUse);
      setActiveQuery(queryToUse);
      if (!overrideQuery) setInput("");
    }
    setLoading(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const currentReqId = ++requestIdRef.current;
    const history = (messages || []).slice(-6).map(m => ({ role: m.role, text: m.text }));

    try {
      // If retrying, wrap original context with a prompt to dynamically heal the SQL typo
      const promptToInterpret = retryContext 
          ? `The previous execution for the query "${queryToUse}" failed with error: ${retryContext.error}. \n\nHint: ${retryContext.hint || "Check table and column names in schema.json"}. \n\nPlease fix the query and provide a valid execution plan.`
          : queryToUse;

      const response = await interpretQuery(promptToInterpret, history, limit, signal);
      if (currentReqId !== requestIdRef.current) return;
      if (!response) throw new Error("No response from AI");

      if (response.type === 'graph') {
         let graphData = response.graph;
         if (!graphData || (!graphData.nodes && !graphData.edges)) {
            try {
               graphData = await executeGraphPlan(response, signal);
            } catch (gErr) {
               // IF GRAPH EXECUTION FAILS, RETRY SILENTLY ONCE
               if (!retryContext && (gErr.response?.data?.error || gErr.message)) {
                  console.log("⚠️ Graph execution failed. Triggering SILENT RETRY...");
                  await handleSend(queryToUse, { 
                    error: gErr.response?.data?.error || gErr.message,
                    hint: gErr.response?.data?.hint
                  });
                  return;
               }
               throw gErr;
            }
            if (currentReqId !== requestIdRef.current) return;
         }

         addMessage("ai", response.message || "I've analyzed the record flow.", { options: response.options, table: response.table });
         setGraph(graphData.nodes || [], graphData.edges || []);
         setViewMode('graph');
         if (response.table) setTableData(response.table);
         saveToHistory(queryToUse, { tableData: response.table, nodes: graphData.nodes, edges: graphData.edges });
      } else if (response.type === 'clarification_required') {
         addMessage("ai", response.message || "Could you clarify?", { options: response.options });
      } else {
         addMessage("ai", response.message || "Here are the results.", { options: response.options, table: response.table });
         if (response.table && response.table.length > 0) {
            setTableData(response.table);
            setViewMode('table');
            saveToHistory(queryToUse, { tableData: response.table });
         }
      }
    } catch (error) {
       if (error.name === 'CanceledError') return;

       // IF SQL/NETWORK FAILS, RETRY SILENTLY ONCE
       if (!retryContext && (error.response?.data?.error || error.message)) {
          console.log("⚠️ Database query failed. Triggering SILENT RETRY...");
          await handleSend(queryToUse, { 
            error: error.response?.data?.error || error.message,
            hint: error.response?.data?.hint
          });
          return;
       }

       if (currentReqId === requestIdRef.current) {
         addMessage("ai", "Something went wrong after a retry attempt.", { 
            isError: true, 
            text: error.response?.data?.error || error.message,
            errorDetails: error.response?.data?.hint 
         });
       }
    } finally {
      if (currentReqId === requestIdRef.current) setLoading(false);
    }
  };

  return {
    input,
    setInput,
    limit,
    setLimit,
    loading,
    handleSend
  };
}
