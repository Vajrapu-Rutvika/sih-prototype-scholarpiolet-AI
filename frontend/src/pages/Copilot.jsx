import { useState } from 'react';
import { Send, Bot, User, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const Copilot = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm your ScholarPilot AI Assistant. How can I help you today? Ask me about your profile, matched scholarships, deadlines, or document verification!",
      suggestedAction: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const response = await apiClient.post('/ai/copilot/', { query: userQuery });
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
          text: "Sorry, I had trouble processing your request. Please make sure you are logged in and try again.",
          suggestedAction: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-md">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Scholarship Copilot <Sparkles size={20} className="text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask questions about eligibility, application deadlines, profile optimization, or uploaded documents.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[550px]">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 rounded-xl text-white shrink-0 ${
                msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-800 dark:bg-slate-700'
              }`}>
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl p-4 text-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
              }`}>
                <p className="leading-relaxed">{msg.text}</p>
                {msg.suggestedAction && (
                  <Link
                    to={msg.suggestedAction}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Go to section <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-white shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 rounded-tl-none text-sm text-slate-500 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Copilot (e.g. 'What is my profile completion?', 'Show my deadlines')..."
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Copilot;
