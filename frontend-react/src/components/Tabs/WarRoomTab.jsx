import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { FaBrain, FaRobot, FaPaperPlane, FaUserTie, FaScaleBalanced } from 'react-icons/fa6';
import { FaMoneyBillTrendUp } from 'react-icons/fa6';
import { FaUserCircle } from 'react-icons/fa';

const WarRoomTab = () => {
  const { token, addToast } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { agent: 'User', content: query };
    setMessages([userMessage]);
    setQuery('');
    setIsDebating(true);

    try {
      const response = await fetch('/api/warroom/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMessage.content })
      });

      if (!response.ok) {
        throw new Error('Failed to start debate');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const events = chunkValue.split('\n\n');
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              setIsDebating(false);
              break;
            }
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                setMessages((prev) => [...prev, parsed]);
              } catch (e) {
                console.error("Error parsing chunk", e, dataStr);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (addToast) addToast('Error starting war room debate', 'error');
      setIsDebating(false);
    }
  };

  const getAgentIcon = (agent) => {
    if (agent === 'User') return <FaUserCircle className="text-blue-500" />;
    if (agent === 'Financial Analyst') return <FaMoneyBillTrendUp className="text-green-500" />;
    if (agent === 'VP of Sales') return <FaUserTie className="text-red-500" />;
    if (agent === 'Synthesizer') return <FaScaleBalanced className="text-purple-500" />;
    return <FaRobot className="text-slate-500" />;
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4 flex flex-col">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <FaBrain className="text-purple-500" /> The War Room
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Consult the AI Board of Directors on strategic business decisions.</p>
      </div>

      <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <FaBrain className="text-purple-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Initialize the War Room</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">
              Ask a complex strategic question. Our specialized AI agents (Finance, Sales) will independently analyze it and synthesize a recommendation.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.agent === 'User' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {msg.agent !== 'User' && (
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm shrink-0">
                    {getAgentIcon(msg.agent)}
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-xl p-4 ${msg.agent === 'User' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                  {msg.agent !== 'User' && (
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 tracking-wider uppercase">
                      {msg.agent}
                    </div>
                  )}
                  <p className={`text-sm ${msg.agent === 'User' ? 'text-white' : 'text-slate-700 dark:text-slate-300'} whitespace-pre-wrap`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {isDebating && (
              <div className="flex gap-3 animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm shrink-0">
                    <FaRobot className="text-slate-400" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isDebating}
              placeholder="e.g., How should we adjust our Q3 pipeline given the new compliance regulations?"
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 dark:text-white"
            />
            <button
              type="submit"
              disabled={!query.trim() || isDebating}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <FaPaperPlane /> {isDebating ? 'Thinking...' : 'Deploy'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WarRoomTab;
