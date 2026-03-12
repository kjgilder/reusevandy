'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import { Search, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getConversations, getMessages, sendMessage, updateOfferStatus } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.css';

interface UserParticipant {
    id: string;
    full_name: string;
    email: string;
}

interface Conversation {
    id: string;
    listing: {
        id: string;
        title: string;
        price: number;
    };
    buyer: UserParticipant;
    seller: UserParticipant;
    last_message_at: string;
}

interface Message {
    id: string;
    sender: UserParticipant;
    content?: string;
    is_offer: boolean;
    offer_amount?: number;
    offer_status?: string;
    created_at: string;
}

export default function MessagesPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        
        const fetchConvos = async () => {
            try {
                const data = await getConversations();
                setConversations(data);
                if (data.length > 0 && !activeConversation) {
                    setActiveConversation(data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch conversations", err);
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConvos();
        
        // Polling for new conversations (every 10 seconds)
        const intervalId = setInterval(fetchConvos, 10000);
        return () => clearInterval(intervalId);
    }, [user, router]); // Intentionally omitting activeConversation to prevent resetting it

    useEffect(() => {
        if (!activeConversation) return;

        const fetchChat = async () => {
            try {
                const chatData = await getMessages(activeConversation.id);
                setMessages(chatData.messages);
                scrollToBottom();
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        };

        fetchChat();
        setLoadingMessages(true);

        // Polling for active chat messages
        const intervalId = setInterval(fetchChat, 3000);
        return () => clearInterval(intervalId);
    }, [activeConversation]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() || !activeConversation) return;

        const tempInput = messageInput;
        setMessageInput('');

        try {
            await sendMessage(activeConversation.id, tempInput);
            // Re-fetch chat immediately
            const chatData = await getMessages(activeConversation.id);
            setMessages(chatData.messages);
            scrollToBottom();
        } catch (err) {
            console.error("Failed to send message", err);
            // Revert input field on failure
            setMessageInput(tempInput);
        }
    };

    const handleUpdateOffer = async (messageId: string, status: 'accepted' | 'declined') => {
        try {
            await updateOfferStatus(messageId, status);
            // Re-fetch chat immediately to show updated status
            if (activeConversation) {
                 const chatData = await getMessages(activeConversation.id);
                 setMessages(chatData.messages);
            }
        } catch (err) {
            console.error("Failed to update offer status", err);
            alert("Errors updating offer. Make sure you are the seller.");
        }
    };

    const getInitials = (name: string, email: string) => {
        const str = name || email;
        if (!str) return "?";
        return str.substring(0, 2).toUpperCase();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null; // Wait for redirect

    return (
        <div className={styles.pageContainer}>
            <main className={styles.messagesMain}>
                {/* Left Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h1>Messages</h1>
                        <div className={styles.searchContainer}>
                            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                            <input type="text" placeholder="Search conversations..." className={styles.searchInput} />
                        </div>
                    </div>
                    
                    <div className={styles.conversationList}>
                        {loadingConversations ? (
                             <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader2 className="animate-spin" size={24} color="var(--vandy-gold)" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                                No conversations yet
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const isUserBuyer = conv.buyer.id === user.id;
                                const otherParticipant = isUserBuyer ? conv.seller : conv.buyer;
                                const participantName = otherParticipant.full_name || otherParticipant.email || 'Unknown';
                                
                                return (
                                    <div 
                                        key={conv.id} 
                                        className={`${styles.conversationItem} ${activeConversation?.id === conv.id ? styles.active : ''}`}
                                        onClick={() => setActiveConversation(conv)}
                                    >
                                        <div className={styles.avatar}>
                                            {getInitials(otherParticipant.full_name, otherParticipant.email)}
                                        </div>
                                        <div className={styles.conversationDetails}>
                                            <div className={styles.conversationHeader}>
                                                <h3 className={styles.participantName}>{participantName}</h3>
                                            </div>
                                            <p className={styles.listingInfo}>
                                                {conv.listing.title} • ${conv.listing.price}
                                            </p>
                                            <p className={styles.lastMessage}>View discussion</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Chat Area */}
                <div className={styles.chatArea}>
                    {activeConversation ? (
                        <>
                            <div className={styles.chatHeader}>
                                {(() => {
                                    const isUserBuyer = activeConversation.buyer.id === user.id;
                                    const otherParticipant = isUserBuyer ? activeConversation.seller : activeConversation.buyer;
                                    const participantName = otherParticipant.full_name || otherParticipant.email || 'Unknown';

                                    return (
                                        <>
                                            <div className={styles.avatar}>
                                                {getInitials(otherParticipant.full_name, otherParticipant.email)}
                                            </div>
                                            <div>
                                                <h2 className={styles.participantName} style={{ fontSize: '16px' }}>{participantName}</h2>
                                                <p className={styles.listingInfo} style={{ color: '#6b7280' }}>
                                                    {activeConversation.listing.title} • ${activeConversation.listing.price}
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className={styles.messageList}>
                                {messages.map((msg, idx) => {
                                    const isSelf = msg.sender.id === user.id;
                                    const isReceiver = !isSelf;
                                    
                                    if (msg.is_offer) {
                                        return (
                                            <div key={msg.id} className={`${styles.messageWrapper} ${isSelf ? styles.sent : styles.received}`}>
                                                <div className={styles.offerBubble}>
                                                    <div>
                                                        <span className={styles.offerBadge}>Offer</span>
                                                        {msg.offer_status === 'accepted' && <span className={styles.acceptedBadge}>Accepted</span>}
                                                        {msg.offer_status === 'declined' && <span className={styles.offerBadge} style={{ backgroundColor: '#ef4444' }}>Declined</span>}
                                                    </div>
                                                    <h3 className={styles.offerAmount}>${msg.offer_amount}</h3>
                                                    <p className={styles.offerText}>{msg.content}</p>
                                                    
                                                    {msg.offer_status === 'pending' && isReceiver && (
                                                        <div className={styles.offerActions}>
                                                            <button 
                                                                className={`${styles.offerActionBtn} ${styles.btnAccept}`}
                                                                onClick={() => handleUpdateOffer(msg.id, 'accepted')}
                                                            >
                                                                <CheckCircle2 size={16} /> Accept
                                                            </button>
                                                            <button 
                                                                className={`${styles.offerActionBtn} ${styles.btnDecline}`}
                                                                onClick={() => handleUpdateOffer(msg.id, 'declined')}
                                                            >
                                                                <XCircle size={16} /> Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.messageTime}>{formatTime(msg.created_at)}</div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={msg.id} className={`${styles.messageWrapper} ${isSelf ? styles.sent : styles.received}`}>
                                            <div className={`${styles.messageBubble} ${isSelf ? styles.sent : styles.received}`}>
                                                {msg.content}
                                            </div>
                                            <div className={styles.messageTime}>{formatTime(msg.created_at)}</div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className={styles.chatInputContainer}>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className={styles.chatInput}
                                />
                                <button type="submit" className={styles.sendButton} disabled={!messageInput.trim()}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                            {loadingConversations ? 'Loading...' : 'Select a conversation to start messaging'}
                        </div>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
