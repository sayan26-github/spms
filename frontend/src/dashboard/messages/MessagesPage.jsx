import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { communicationService } from '../../services/communicationService';
import { Mail, Send, Plus, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const MessagesPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inbox');
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Compose State
    const [recipients, setRecipients] = useState([]);
    const [composeData, setComposeData] = useState({ receiver: '', subject: '', body: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [activeTab]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await communicationService.getMessages(activeTab);
            setMessages(data.results || []); // Handle pagination
            setSelectedMessage(null);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageClick = async (msg) => {
        if (activeTab === 'inbox' && !msg.is_read) {
            // Optimistically update read status
            const updated = { ...msg, is_read: true };
            setMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
            try {
                await communicationService.getMessage(msg.id); // Triggers mark read
            } catch (e) {
                console.error("Failed to mark read", e);
            }
        }
        setSelectedMessage(msg);
    };

    const handleComposeOpen = async () => {
        setIsComposeOpen(true);
        try {
            const users = await communicationService.getRecipients();
            setRecipients(users);
        } catch (e) {
            console.error("Failed to fetch recipients", e);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await communicationService.sendMessage(composeData);
            setIsComposeOpen(false);
            setComposeData({ receiver: '', subject: '', body: '' });
            if (activeTab === 'sent') fetchMessages();
            alert("Message sent!");
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* Sidebar List */}
            <div className={`${selectedMessage ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-100`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    <button
                        onClick={handleComposeOpen}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-sm"
                        title="Compose"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'inbox' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'sent' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sent
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No messages</div>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => handleMessageClick(msg)}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!msg.is_read && activeTab === 'inbox' ? 'bg-indigo-50/50' : ''} ${selectedMessage?.id === msg.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-semibold text-sm ${!msg.is_read && activeTab === 'inbox' ? 'text-indigo-900' : 'text-gray-700'}`}>
                                        {activeTab === 'inbox'
                                            ? `${msg.sender_details?.first_name} ${msg.sender_details?.last_name}`
                                            : `To: ${msg.receiver_details?.first_name} ${msg.receiver_details?.last_name}`
                                        }
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleDateString()}</span>
                                </div>
                                <h3 className={`text-sm mb-1 truncate ${!msg.is_read && activeTab === 'inbox' ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{msg.subject}</h3>
                                <p className="text-xs text-gray-400 truncate">{msg.body}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Message Detail */}
            <div className={`${selectedMessage ? 'flex' : 'hidden md:flex'} w-full md:w-2/3 flex-col bg-gray-50/30`}>
                {selectedMessage ? (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="p-6 bg-white border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <button onClick={() => setSelectedMessage(null)} className="md:hidden mb-4 text-gray-500 hover:text-gray-700">
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedMessage.subject}</h2>
                                <div className="flex items-center space-x-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {activeTab === 'inbox'
                                                ? `${selectedMessage.sender_details?.first_name} ${selectedMessage.sender_details?.last_name}`
                                                : `To: ${selectedMessage.receiver_details?.first_name} ${selectedMessage.receiver_details?.last_name}`
                                            }
                                        </p>
                                        <p className="text-xs text-gray-400">{new Date(selectedMessage.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.body}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Mail size={48} className="mb-4 opacity-20" />
                        <p>Select a message to read</p>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {isComposeOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">New Message</h3>
                            <button onClick={() => setIsComposeOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSend} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    value={composeData.receiver}
                                    onChange={e => setComposeData({ ...composeData, receiver: e.target.value })}
                                >
                                    <option value="">Select Recipient</option>
                                    {recipients.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    value={composeData.subject}
                                    onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                                    placeholder="Enter subject..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows="5"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                    value={composeData.body}
                                    onChange={e => setComposeData({ ...composeData, body: e.target.value })}
                                    placeholder="Type your message..."
                                ></textarea>
                            </div>
                            <div className="pt-2 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsComposeOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    {sending ? <span>Sending...</span> : <><span>Send</span> <Send size={16} /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MessagesPage;
