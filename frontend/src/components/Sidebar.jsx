import { useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useChatEngine } from "../hooks/useChatEngine";

const AgentLogo = () => (
  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0 shadow-md">
    <span className="text-white font-black text-lg select-none">A</span>
  </div>
);

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-100 shadow-inner">
     <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  </div>
);

const SuggestionChip = ({ icon, text, onClick, variant = 'secondary' }) => {
  const baseStyles = "w-full px-4 py-3 rounded-2xl text-[13px] font-semibold flex items-start gap-3 transition-all cursor-pointer border text-left";
  const variants = {
    primary: "bg-[#1a1a1a] text-white border-transparent hover:bg-black shadow-sm",
    secondary: "bg-white text-[#1a1a1a] border-gray-100 hover:border-gray-300 hover:bg-gray-50 shadow-sm",
    danger: "bg-red-50 border-red-100 text-red-700 hover:bg-red-100 hover:border-red-200 shadow-sm"
  };
  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
      {icon && <span className="text-base shrink-0 mt-0.5">{icon}</span>}
      <span className="leading-relaxed whitespace-normal flex-1">{text}</span>
    </button>
  );
};

/**
 * Sidebar Component
 * Manages the primary user chat interface, query inputs, and message history interaction.
 * Delegates AI logic and API interactions to the useChatEngine custom hook.
 */
export default function Sidebar() {
  const { messages } = useChatStore();
  const { input, setInput, loading, handleSend } = useChatEngine();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div className="w-full h-full bg-white border-l border-gray-100 flex flex-col font-sans antialiased text-gray-900">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-50 flex flex-col shrink-0">
        <h2 className="text-[17px] font-black text-gray-900 tracking-tight">Chat with Graph</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-10 scrollbar-hide">
        
        {/* Intro Message */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <AgentLogo />
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-gray-900 leading-none">AI Query Assistant</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Graph Agent</span>
            </div>
          </div>
          <div className="text-[14px] text-[#2d2d2d] leading-relaxed font-medium pl-[44px]">
             Hi! I can your AI Assistant help you in every way to analyze and understand the data. You can ask me anything related to my current database.
             you can view database schema on the database canvas. If you ask me relationship i will help you to see them on the graph canvas. If you need database query want 
             to see database records view it under the table canvas. Lets begin with some suggestion.

             NOTE: If you find any error try again after sometimes. As my model is very low on credits.(credits per minuite).🧾  
          </div>
          
          <div className="pl-[44px] mt-2">
             <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">Suggested Analysis</div>
             <div className="flex flex-col gap-2.5">
               <SuggestionChip variant="primary" icon="⚡" text="Trace the full flow of a given billing document" onClick={() => handleSend("Trace the full flow of a given billing document (Sales Order → Delivery → Billing → Journal Entry)")} />
               <SuggestionChip variant="primary" icon="📦" text="Product & Business Partners Relation" onClick={() => handleSend("give me product and buisness partners relation")} />
               <SuggestionChip variant="primary" icon="📍" text="Identify sales orders that have broken or incomplete flows" onClick={() => handleSend("Identify sales orders that have broken or incomplete flows ")} />
               <SuggestionChip variant="primary" icon="🧾 " text="Which products are associated with the highest number of billing documents?" onClick={() => handleSend("Which products are associated with the highest number of billing documents?")} />
             </div>
          </div>
        </div>

        {/* Dynamic Messages */}
        {(messages || []).map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-4`}>
            {/* Identity Header */}
            <div className={`flex items-center gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               {msg.role === 'user' ? <UserAvatar /> : <AgentLogo />}
               <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[13px] font-black text-gray-900 leading-none">{msg.role === 'user' ? 'You' : 'AI Query Assistant'}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{msg.role === 'user' ? 'Enterprise User' : 'Graph Agent'}</span>
               </div>
            </div>

            {/* Content Body */}
            <div className={`
              ${msg.role === 'user' 
                ? 'bg-[#1a1a1a] text-white px-5 py-3.5 rounded-3xl rounded-tr-sm shadow-xl max-w-[90%] text-[14px] font-bold leading-relaxed' 
                : 'text-[14px] text-[#2d2d2d] leading-relaxed font-medium pl-[44px] w-full'
              }
            `}>
              {msg.isError ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 font-bold text-[13px]">
                   <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      Query Attempt Failed
                   </div>
                   <div className="font-medium text-[12px] opacity-80 leading-relaxed">{msg.text}</div>
                   {msg.errorDetails && <div className="mt-2 font-mono text-[10px] p-2 bg-red-100/50 rounded border border-red-200">{msg.errorDetails}</div>}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: (msg.text || "").replace(/\*\*(.*?)\*\*/g, '<span class="font-black text-black">$1</span>') }} />
              )}

              {/* Inline Table */}
              {msg.table && msg.table.length > 0 && (
                <div className="mt-5 overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-lg w-full">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        {Object.keys(msg.table[0]).slice(0, 4).map(k => (
                          <th key={k} className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-[9px]">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {msg.table.slice(0, 3).map((row, ridx) => (
                        <tr key={ridx} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).slice(0, 4).map((v, vidx) => (
                            <td key={vidx} className="px-4 py-3 text-gray-700 font-bold truncate max-w-[120px]">
                              {String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 pl-[44px] animate-pulse">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            <span className="w-2 h-2 bg-gray-200 rounded-full"></span>
            <span className="w-2 h-2 bg-gray-100 rounded-full"></span>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4 w-full" />
      </div>

      {/* Input Area (MATCHING SCREENSHOT WITH DYNAMIC STATUS) */}
      <div className="px-6 py-6 border-t border-gray-50 bg-[#fafafa]">
        <div className="border border-gray-200 rounded-3xl bg-white shadow-2xl shadow-gray-200/50 overflow-hidden focus-within:border-black transition-all">
          <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full shadow-sm transition-colors duration-500 ${loading ? 'bg-orange-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                AI QUERY ASSISTANT IS {loading ? 'PROCESSING...' : 'AWAITING INSTRUCTIONS'}
             </span>
          </div>
          <div className="flex items-end p-2 pr-4 min-h-[100px]">
            <textarea
              className="flex-1 p-3 bg-transparent text-[14.5px] text-gray-900 outline-none placeholder-gray-300 font-bold resize-none leading-relaxed"
              placeholder="Analyze anything"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                }
              }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="mb-2 bg-gray-200 hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 text-white px-6 py-2.5 rounded-2xl text-[13px] font-black shadow-sm transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}