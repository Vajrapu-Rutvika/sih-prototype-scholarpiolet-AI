import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, User, ArrowRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import apiClient from '../../api/client';

const FloatingCopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Extract page context name from current path
  const getPageName = () => {
    const path = location.pathname;
    if (path.includes('find-scholarships')) return 'FindScholarships';
    if (path.includes('applications')) return 'Applications';
    if (path.includes('documents')) return 'Documents';
    if (path.includes('profile')) return 'Profile';
    if (path.includes('portfolio')) return 'Portfolio';
    if (path.includes('deadlines')) return 'Deadlines';
    if (path.includes('saved')) return 'SavedScholarships';
    return 'Dashboard';
  };

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi! I'm your ScholarPilot AI Assistant. Ask me anything about your matched scholarships, missing documents, or eligibility!",
      suggestedAction: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await apiClient.post('/ai/copilot/', {
        query: userText,
        page_context: getPageName()
      });

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: response.data.reply,
          suggestedAction: response.data.suggested_action
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I'm having trouble connecting right now. Make sure you are logged in.",
          suggestedAction: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center gap-2 font-medium transition-all transform hover:scale-105"
      >
        <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
        <span className="hidden sm:inline">Ask ScholarPilot</span>
      </button>

      {/* Floating Drawer / Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm">ScholarPilot AI Copilot</h3>
                <p className="text-xs text-blue-100 opacity-90">Active on {getPageName()} page</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`p-1.5 rounded-lg text-white shrink-0 ${
                  msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-800 dark:bg-slate-700'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                }`}>
                  <p>{msg.text}</p>
                  {msg.suggestedAction && (
                    <Link
                      to={msg.suggestedAction}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View details <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Bot className="w-4 h-4 animate-bounce" /> Analyzing your live profile & data...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Copilot..."
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingCopilot;
