import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hi there! I am your AI placement assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await api.post(ENDPOINTS.CHAT, { message: userText });
            setMessages(prev => [...prev, { role: 'ai', text: response.data.response }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to my server. Please try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chatbot Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300 h-[500px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center shadow-md">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 backdrop-blur-sm">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">SPMS Assistant</h3>
                            <p className="text-xs text-indigo-100 opacity-90">Personalized AI Guide</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 ml-2' : 'bg-white border border-gray-200 mr-2'}`}>
                                        {msg.role === 'user' ? <User size={16} className="text-indigo-600" /> : <Bot size={16} className="text-indigo-600" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-end max-w-[85%] flex-row">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 mr-2 flex items-center justify-center shadow-sm">
                                        <Bot size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-bl-none shadow-sm flex items-center">
                                        <Loader2 size={16} className="animate-spin text-indigo-400" />
                                        <span className="ml-2 text-xs text-gray-500">AI is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form onSubmit={handleSend} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                            >
                                <Send size={18} className="ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
