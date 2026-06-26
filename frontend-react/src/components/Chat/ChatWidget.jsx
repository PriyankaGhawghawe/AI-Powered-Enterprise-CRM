import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { FaMessage, FaXmark, FaPaperPlane, FaRobot, FaUser, FaTriangleExclamation, FaBookmark, FaRegBookmark, FaShareNodes, FaDownload, FaCheck, FaListUl } from 'react-icons/fa6';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const ChatWidget = () => {
  const { activeRole, businessData, globalChatPrompt, setGlobalChatPrompt, bookmarks, setBookmarks, customBriefings, setCustomBriefings, addToast, token } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'bookmarks'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [importedIndex, setImportedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, viewMode]);

  useEffect(() => {
    if (globalChatPrompt) {
      setIsOpen(true);
      setViewMode('chat');
      // We process the prompt but don't set it to input so the user just sees it as their sent message
      setTimeout(() => {
        handleSend(globalChatPrompt);
        setGlobalChatPrompt(null);
      }, 50);
    }
  }, [globalChatPrompt, setGlobalChatPrompt]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, role: activeRole, simulated_db: businessData })
      });
      
      const data = await res.json();
      
      let responseText = data.response;
      // Some LLMs wrap tables in ```markdown code blocks. This unwraps them so marked parses them as actual tables.
      responseText = responseText.replace(/```(?:markdown|md)?\n([\s\S]*?)\n```/g, (match, p1) => {
        if (p1.trim().startsWith('|')) {
          return p1;
        }
        return match;
      });

      // Parse markdown and sanitize
      const rawHtml = marked.parse(responseText);
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', contentHtml: cleanHtml, rawContent: data.response, actions: data.suggested_actions }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', contentHtml: '<p class="text-rose-500">Error connecting to executive AI.</p>' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (msg, index) => {
    try {
      await navigator.clipboard.writeText(msg.rawContent || msg.contentHtml.replace(/<[^>]+>/g, ''));
      setCopiedIndex(index);
      addToast('Copied to clipboard', 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      addToast('Failed to copy text', 'error');
      console.error('Failed to copy text: ', err);
    }
  };

  const handleBookmark = (msg) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.id === msg.id);
      if (exists) {
        addToast('Removed from bookmarks', 'info');
        return prev.filter(b => b.id !== msg.id);
      }
      addToast('Saved to bookmarks', 'success');
      return [...prev, msg];
    });
  };

  const handleImport = (msg, index) => {
    const newBriefing = {
      id: `imported-${Date.now()}`,
      title: 'AI Generated Insight',
      date: new Date().toISOString().split('T')[0],
      content: msg.rawContent || msg.contentHtml.replace(/<[^>]+>/g, ''),
      type: 'Custom'
    };
    setCustomBriefings(prev => [newBriefing, ...prev]);
    setImportedIndex(index);
    addToast('Insight added to Executive Reports', 'success');
    setTimeout(() => setImportedIndex(null), 2000);
  };

  const templates = [
    "Summarize risk factors",
    "Analyze pipeline health",
    "Generate status report"
  ];

  return (
    <>
      {/* Background Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-[60] flex flex-col transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FaRobot className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Executive AI</h3>
              <p className="text-blue-200 text-xs font-medium">Business Intelligence Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode(viewMode === 'chat' ? 'bookmarks' : 'chat')} 
              className="hover:text-blue-200 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
              title={viewMode === 'chat' ? "View Bookmarks" : "Back to Chat"}
            >
              {viewMode === 'chat' ? <><FaBookmark /> <span>Bookmarks</span></> : <><FaMessage /> <span>Chat</span></>}
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <FaXmark className="text-xl" />
            </button>
          </div>
        </div>
        
        {/* Main Area */}
        {viewMode === 'bookmarks' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">
              <FaBookmark className="text-blue-500" /> Saved Insights
            </h4>
            {bookmarks.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 mt-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FaRegBookmark className="text-2xl opacity-50" />
                </div>
                <p className="text-sm">No bookmarks yet. Save important AI insights to review them later!</p>
              </div>
            ) : (
              bookmarks.map(b => (
                <div key={b.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-md transition-shadow">
                  <button onClick={() => handleBookmark(b)} className="absolute top-4 right-4 text-blue-500 hover:text-blue-600 transition-colors" title="Remove Bookmark">
                    <FaBookmark />
                  </button>
                  <div className="prose prose-sm dark:prose-invert pr-6 max-w-none" dangerouslySetInnerHTML={{ __html: b.contentHtml }} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center mt-10">
                <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <FaRobot className="text-3xl text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">How can I assist you today?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ask questions, analyze data, or generate reports.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {msg.role === 'user' ? <FaUser size={14} /> : <FaRobot size={16} />}
                </div>
                <div className={`flex flex-col gap-1.5 ${msg.role === 'assistant' ? 'max-w-[85%]' : 'max-w-[75%]'}`}>
                  <div className={`p-4 rounded-2xl text-sm overflow-x-auto shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                    {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                    {msg.contentHtml && <div className="prose prose-sm dark:prose-invert max-w-none prose-tables:w-full prose-tables:border-collapse prose-th:bg-slate-100 dark:prose-th:bg-slate-700 prose-th:p-2 prose-td:p-2 prose-td:border-t dark:prose-td:border-slate-700" dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <button onClick={() => handleBookmark(msg)} className="text-slate-400 hover:text-blue-500 transition-colors text-xs flex items-center gap-1.5 font-medium" title={bookmarks.find(b => b.id === msg.id) ? "Remove Bookmark" : "Save Bookmark"}>
                        {bookmarks.find(b => b.id === msg.id) ? <FaBookmark className="text-blue-500" /> : <><FaRegBookmark /> Save</>}
                      </button>
                      <button onClick={() => handleShare(msg, i)} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs flex items-center gap-1.5 font-medium" title="Copy to Clipboard">
                        {copiedIndex === i ? <FaCheck className="text-emerald-500" /> : <><FaShareNodes /> Copy</>}
                      </button>
                      <button onClick={() => handleImport(msg, i)} className="text-slate-400 hover:text-purple-500 transition-colors text-xs flex items-center gap-1.5 ml-auto font-medium" title="Add to Executive Reports">
                        {importedIndex === i ? <FaCheck className="text-purple-500" /> : <><FaDownload /> Import to Briefing</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <FaRobot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        )}
        
        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 relative z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          {activeRole === 'Employee' && (
            <div className="flex items-start gap-2 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500 rounded-lg text-xs font-medium border border-yellow-200 dark:border-yellow-900/50">
              <FaTriangleExclamation className="mt-0.5 flex-shrink-0 text-sm" />
              <span><strong>Limited Access:</strong> Sensitive actions restricted. Queries are read-only.</span>
            </div>
          )}
          
          {/* Prompt Templates */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {templates.map((t, i) => (
                <button key={i} onClick={() => handleSend(t)} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all whitespace-nowrap font-medium">
                  {t}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the executive team..."
              className="w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-sm text-slate-900 dark:text-white transition-all shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading} 
              className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all shadow-md disabled:shadow-none"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">BusinessOS Executive AI</span>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Only visible when drawer is closed) */}
      <div className={`tour-step-chat fixed bottom-6 right-6 z-50 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center text-xl transition-transform hover:scale-110 relative border-2 border-white/10"
        >
          <FaMessage />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        </button>
      </div>
    </>
  );
};
export default ChatWidget;
