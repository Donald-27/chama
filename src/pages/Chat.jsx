import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Send, Paperclip, MoreVertical, Image as ImageIcon, X, Check, CheckCheck, Reply, Pin } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Chat() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const chamaId = urlParams.get('chamaId');

    const [user, setUser] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);
            } catch (e) {
                console.error(e);
            }
        };
        loadUser();
    }, []);

    const { data: chama } = useQuery({
        queryKey: ['chama', chamaId],
        queryFn: async () => {
            const chamas = await base44.entities.Chama.filter({ id: chamaId });
            return chamas[0];
        },
        enabled: !!chamaId,
    });

    const { data: members = [] } = useQuery({
        queryKey: ['chama-members', chamaId],
        queryFn: () => base44.entities.ChamaMember.filter({ chama_id: chamaId }),
        enabled: !!chamaId,
    });

    const { data: messages = [], isLoading, refetch } = useQuery({
        queryKey: ['chama-messages', chamaId],
        queryFn: () => base44.entities.ChatMessage.filter({ chama_id: chamaId }, 'created_date'),
        enabled: !!chamaId,
        refetchInterval: 3000,
    });

    const pinnedMessages = messages.filter(m => m.is_pinned);

    const sendMessageMutation = useMutation({
        mutationFn: async (messageData) => {
            await base44.entities.ChatMessage.create({
                chama_id: chamaId,
                sender_email: user.email,
                sender_name: user.full_name,
                ...messageData,
            });
        },
        onSuccess: () => {
            setMessage('');
            setSelectedImage(null);
            setReplyTo(null);
            queryClient.invalidateQueries(['chama-messages', chamaId]);
        },
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!message.trim() && !selectedImage) return;

        sendMessageMutation.mutate({
            message: message.trim() || (selectedImage ? '📷 Image' : ''),
            message_type: selectedImage ? 'image' : 'text',
            attachment_url: selectedImage,
            reply_to_id: replyTo?.id,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setSelectedImage(file_url);
        } catch (error) {
            console.error('Upload failed:', error);
        }
        setUploading(false);
    };

    const togglePin = async (msg) => {
        await base44.entities.ChatMessage.update(msg.id, { is_pinned: !msg.is_pinned });
        refetch();
    };

    const currentMember = members.find(m => m.user_email === user?.email);
    const isLeader = ['admin', 'chairperson'].includes(currentMember?.role);

    const groupedMessages = messages.reduce((groups, msg) => {
        const date = format(new Date(msg.created_date), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(msg);
        return groups;
    }, {});

    const formatDateHeader = (dateStr) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'EEEE, MMMM d');
    };

    const getReplyMessage = (replyId) => {
        return messages.find(m => m.id === replyId);
    };

    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: '#1a2332' }}>
            {/* Header */}
            <header className="px-4 py-3 flex items-center gap-4 flex-shrink-0" style={{ borderBottom: '1px solid #2a3f55' }}>
                <Link
                    to={createPageUrl(`ChamaDetail?id=${chamaId}`)}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: '#243447' }}
                >
                    <ArrowLeft className="w-5 h-5 text-cyan-400" />
                </Link>

                <div className="flex items-center gap-3 flex-1">
                    {chama?.image_url ? (
                        <img src={chama.image_url} alt={chama?.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#243447' }}>
                            <span className="text-cyan-400 font-bold">
                                {chama?.name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="font-semibold text-white truncate">{chama?.name}</h1>
                        <p className="text-xs text-cyan-400">{members.length} members • {messages.length} messages</p>
                    </div>
                </div>

                <button className="p-2">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
            </header>

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
                <div className="px-4 py-2" style={{ backgroundColor: '#243447', borderBottom: '1px solid #2a3f55' }}>
                    <div className="flex items-center gap-2">
                        <Pin className="w-4 h-4 text-amber-400" />
                        <p className="text-amber-400 text-xs font-medium">Pinned</p>
                    </div>
                    <p className="text-white text-sm truncate">{pinnedMessages[0]?.message}</p>
                </div>
            )}

            {/* Reply Preview */}
            {replyTo && (
                <div className="px-4 py-2 flex items-center gap-3" style={{ backgroundColor: '#243447', borderBottom: '1px solid #2a3f55' }}>
                    <div className="flex-1 border-l-2 border-cyan-400 pl-3">
                        <p className="text-cyan-400 text-xs">{replyTo.sender_name}</p>
                        <p className="text-gray-400 text-sm truncate">{replyTo.message}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)}>
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                <Skeleton className="h-16 w-48 rounded-2xl" style={{ backgroundColor: '#243447' }} />
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#243447' }}>
                            <span className="text-4xl">💬</span>
                        </div>
                        <p className="text-lg font-medium text-white">Start the conversation!</p>
                        <p className="text-sm text-gray-400">Send the first message</p>
                    </div>
                ) : (
                    <>
                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                <div className="flex items-center justify-center my-4">
                                    <span className="px-3 py-1 rounded-full text-xs text-gray-400" style={{ backgroundColor: '#243447' }}>
                                        {formatDateHeader(date)}
                                    </span>
                                </div>

                                {msgs.map((msg, idx) => {
                                    const isMe = msg.sender_email === user?.email;
                                    const showAvatar = !isMe && (idx === 0 || msgs[idx - 1]?.sender_email !== msg.sender_email);
                                    const replyMessage = msg.reply_to_id ? getReplyMessage(msg.reply_to_id) : null;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 group`}
                                        >
                                            {!isMe && showAvatar && (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0" style={{ backgroundColor: '#243447' }}>
                                                    <span className="text-cyan-400 text-xs font-semibold">
                                                        {msg.sender_name?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            {!isMe && !showAvatar && <div className="w-8 mr-2" />}

                                            <div className="max-w-[75%]">
                                                {/* Reply reference */}
                                                {replyMessage && (
                                                    <div className="mb-1 border-l-2 border-gray-500 pl-2 ml-2">
                                                        <p className="text-gray-500 text-xs">{replyMessage.sender_name}</p>
                                                        <p className="text-gray-500 text-xs truncate">{replyMessage.message}</p>
                                                    </div>
                                                )}

                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 ${isMe
                                                        ? 'bg-cyan-500 text-white rounded-br-md'
                                                        : 'text-white rounded-bl-md'
                                                        } ${msg.is_pinned ? 'ring-2 ring-amber-400' : ''}`}
                                                    style={!isMe ? { backgroundColor: '#243447' } : {}}
                                                >
                                                    {!isMe && showAvatar && (
                                                        <p className="text-xs font-medium text-cyan-400 mb-1">
                                                            {msg.sender_name}
                                                        </p>
                                                    )}

                                                    {msg.message_type === 'image' && msg.attachment_url && (
                                                        <img
                                                            src={msg.attachment_url}
                                                            alt="Shared"
                                                            className="rounded-lg max-w-full mb-2 cursor-pointer"
                                                            onClick={() => window.open(msg.attachment_url, '_blank')}
                                                        />
                                                    )}

                                                    {msg.message && msg.message !== '📷 Image' && (
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                    )}

                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <p className={`text-xs ${isMe ? 'text-cyan-100' : 'text-gray-500'}`}>
                                                            {format(new Date(msg.created_date), 'h:mm a')}
                                                        </p>
                                                        {isMe && (
                                                            <CheckCheck className="w-4 h-4 text-cyan-100" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="hidden group-hover:flex items-center gap-1 mt-1 justify-end">
                                                    <button
                                                        onClick={() => setReplyTo(msg)}
                                                        className="p-1 rounded hover:bg-gray-700"
                                                    >
                                                        <Reply className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    {isLeader && (
                                                        <button
                                                            onClick={() => togglePin(msg)}
                                                            className="p-1 rounded hover:bg-gray-700"
                                                        >
                                                            <Pin className={`w-4 h-4 ${msg.is_pinned ? 'text-amber-400' : 'text-gray-400'}`} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {selectedImage && (
                <div className="px-4 py-2" style={{ backgroundColor: '#243447' }}>
                    <div className="relative inline-block">
                        <img src={selectedImage} alt="Preview" className="h-20 rounded-lg" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid #2a3f55' }}>
                <div className="flex items-end gap-3">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ImageIcon className="w-5 h-5" />
                        )}
                    </button>

                    <div className="flex-1">
                        <Input
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="rounded-2xl border-0 text-white"
                            style={{ backgroundColor: '#243447' }}
                        />
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={(!message.trim() && !selectedImage) || sendMessageMutation.isPending}
                        size="icon"
                        className="rounded-full bg-cyan-500 hover:bg-cyan-600 h-10 w-10 flex-shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}