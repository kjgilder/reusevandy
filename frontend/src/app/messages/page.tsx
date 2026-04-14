'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import { Search, Send, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { getConversations, getMessages, sendMessage, updateOfferStatus, sendOffer, confirmTransaction, cancelListing, BASE_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ProductDetailModal from '../../components/ProductDetailModal';
import styles from './page.module.css';

interface UserParticipant {
    id: string;
    full_name: string;
    email: string;
    profile_picture?: string;
}

interface Conversation {
    id: string;
    listing: {
        id: string;
        title: string;
        description: string;
        price: number;
        category: string;
        images?: string[];
        status: string;
        seller_confirmed_sold: boolean;
        buyer_confirmed_sold: boolean;
        created_at: string;
        seller: UserParticipant;
    };
    buyer: UserParticipant;
    seller: UserParticipant;
    last_message_at: string;
    unread_count?: number;
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
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isOfferMode, setIsOfferMode] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
    const [transacting, setTransacting] = useState(false);
    const closingRef = useRef(false);
    
    // Filters
    const [role, setRole] = useState<'buying' | 'selling' | undefined>(undefined);
    const [filter, setFilter] = useState<'active' | 'past'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (loading) return; 
        if (!user) {
            router.push('/login');
            return;
        }
        
        const fetchConvos = async () => {
            if (!user) return;
            try {
                const data = await getConversations({ role, search: debouncedSearch, filter });
                setConversations(data);
                
                // If we have an active conversation, update its unread count to 0 locally
                if (activeConversation) {
                    setConversations(prev => prev.map(c => 
                        c.id === activeConversation.id ? { ...c, unread_count: 0 } : c
                    ));
                }

                if (data.length > 0 && !activeConversation) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const targetConvId = urlParams.get('conversationId');
                    if (targetConvId) {
                        const target = data.find((c: Conversation) => c.id === targetConvId);
                        setActiveConversation(target || data[0]);
                    } else if (window.innerWidth > 768) {
                        // Only auto-select the first conversation on desktop
                        // On mobile, we want to stay in the list view
                        setActiveConversation(data[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch conversations", err);
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConvos();
        
        const intervalId = setInterval(fetchConvos, 30000); // Polling every 30s
        return () => clearInterval(intervalId);
    }, [user, router, activeConversation, loading, role, debouncedSearch, filter]);

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
        const wasOfferMode = isOfferMode;
        setMessageInput('');
        if (wasOfferMode) setIsOfferMode(false);

        try {
            if (wasOfferMode) {
                await sendOffer({
                    listing_id: activeConversation.listing.id,
                    offer_amount: Number(tempInput),
                    message: `I'd like to offer $${tempInput} for the ${activeConversation.listing.title}`
                });
            } else {
                await sendMessage(activeConversation.id, tempInput);
            }
            const chatData = await getMessages(activeConversation.id);
            setMessages(chatData.messages);
            scrollToBottom();
        } catch (err) {
            console.error("Failed to send message", err);
            setMessageInput(tempInput);
        }
    };

    const handleUpdateOffer = async (messageId: string, status: 'accepted' | 'declined') => {
        try {
            await updateOfferStatus(messageId, status);
            if (activeConversation) {
                 const chatData = await getMessages(activeConversation.id);
                 setMessages(chatData.messages);
            }
            // Refresh conversations to update listing status in sidebar
            const data = await getConversations({ role, search: debouncedSearch, filter });
            setConversations(data);
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error("Failed to update offer status", err);
            alert(error.message || "Errors updating offer. Make sure you are the seller.");
        }
    };

    const handleCompleteTransaction = async () => {
        if (!activeConversation) return;
        setTransacting(true);
        setTransactionStatus(null);
        try {
            await confirmTransaction(activeConversation.listing.id);
            setTransactionStatus('completed');
            // Refresh conversations and update the active one
            const data = await getConversations({ role, search: debouncedSearch, filter });
            setConversations(data);
            // Update the active conversation's listing status in local state
            const updated = data.find((c: Conversation) => c.id === activeConversation.id);
            if (updated) setActiveConversation(updated);
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error("Failed to complete transaction", err);
            setTransactionStatus('error:' + (error.message || 'Failed to confirm transaction'));
        } finally {
            setTransacting(false);
        }
    };

    const handleCancelTransaction = async () => {
        if (!activeConversation) return;
        setTransacting(true);
        setTransactionStatus(null);
        try {
            await cancelListing(activeConversation.listing.id);
            setTransactionStatus('cancelled');
            // Refresh
            const data = await getConversations({ role, search: debouncedSearch, filter });
            setConversations(data);
            const updated = data.find((c: Conversation) => c.id === activeConversation.id);
            if (updated) setActiveConversation(updated);
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error("Failed to cancel transaction", err);
            setTransactionStatus('error:' + (error.message || 'Failed to cancel transaction'));
        } finally {
            setTransacting(false);
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

    const getTimeAgo = (dateString: string) => {
        if (!dateString) return "Just now";
        const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(safeDateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds <= 0) return "Just now";
        let interval = seconds / 86400;
        if (interval >= 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval >= 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval >= 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    };

    if (!user) return null;

    return (
        <div className={styles.pageContainer}>
            <main className={styles.messagesMain}>
                <div className={`${styles.sidebar} ${!activeConversation ? styles.showMobile : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <h1>Messages</h1>
                        <div className={styles.filterTabs}>
                            <button 
                                className={`${styles.filterTab} ${!role ? styles.activeTab : ''}`}
                                onClick={() => setRole(undefined)}
                            >
                                All
                            </button>
                            <button 
                                className={`${styles.filterTab} ${role === 'buying' ? styles.activeTab : ''}`}
                                onClick={() => setRole('buying')}
                            >
                                Buying
                            </button>
                            <button 
                                className={`${styles.filterTab} ${role === 'selling' ? styles.activeTab : ''}`}
                                onClick={() => setRole('selling')}
                            >
                                Selling
                            </button>
                            <button 
                                className={`${styles.filterTab} ${filter === 'past' ? styles.activeTab : ''}`}
                                onClick={() => {
                                    setFilter(filter === 'past' ? 'active' : 'past');
                                    setRole(undefined); // Clear role when switching to past for better view
                                }}
                            >
                                {filter === 'past' ? 'Active Chat' : 'Past'}
                            </button>
                        </div>
                        <div className={styles.searchContainer}>
                            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                            <input 
                                type="text" 
                                placeholder="Search by name, item or content..." 
                                className={styles.searchInput} 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className={styles.conversationList}>
                        {loadingConversations ? (
                             <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader2 className="animate-spin" size={24} color="var(--vandy-gold)" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                                {searchQuery || role ? 'No matches found' : 'No conversations yet'}
                            </div>
                        ) : (
                            (() => {
                                // Group by listing
                                const grouped: Record<string, { listing: Conversation['listing'], convs: Conversation[] }> = {};
                                conversations.forEach(conv => {
                                    const lid = conv.listing.id;
                                    if (!grouped[lid]) {
                                        grouped[lid] = { listing: conv.listing, convs: [] };
                                    }
                                    grouped[lid].convs.push(conv);
                                });

                                return Object.values(grouped).map(group => (
                                    <div key={group.listing.id} className={styles.listingGroup}>
                                        <div className={styles.listingGroupHeader}>
                                            {group.listing.title} <span>${group.listing.price}</span>
                                        </div>
                                        {group.convs.map(conv => {
                                            const isUserBuyer = conv.buyer.id === user.id;
                                            const otherParticipant = isUserBuyer ? conv.seller : conv.buyer;
                                            const participantName = otherParticipant.full_name || otherParticipant.email || 'Unknown';
                                            const isUnread = (conv.unread_count || 0) > 0;
                                            
                                            return (
                                                <div 
                                                    key={conv.id} 
                                                    className={`${styles.conversationItem} ${activeConversation?.id === conv.id ? styles.active : ''}`}
                                                    onClick={() => {
                                                        if (closingRef.current) return;
                                                        setActiveConversation(conv);
                                                    }}
                                                >
                                                    <div className={styles.avatar}>
                                                        {otherParticipant.profile_picture ? (
                                                            <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                                                <Image 
                                                                    src={otherParticipant.profile_picture.startsWith('http') ? otherParticipant.profile_picture : `${BASE_URL}${otherParticipant.profile_picture}`} 
                                                                    alt={participantName} 
                                                                    fill 
                                                                    style={{ objectFit: 'cover' }}
                                                                    sizes="40px"
                                                                />
                                                            </div>
                                                        ) : (
                                                            getInitials(otherParticipant.full_name, otherParticipant.email)
                                                        )}
                                                    </div>
                                                    <div className={styles.conversationDetails}>
                                                        <div className={styles.conversationHeader}>
                                                            <h3 className={styles.participantName} style={{ fontWeight: isUnread ? '800' : '600' }}>
                                                                {participantName}
                                                            </h3>
                                                            {isUnread && (
                                                                <div className={styles.unreadDot} />
                                                            )}
                                                        </div>
                                                        <p className={styles.lastMessage} style={{ fontWeight: isUnread ? '700' : '400', color: isUnread ? 'var(--vandy-gold)' : '#9ca3af' }}>
                                                            {isUnread ? 'New message' : 'View thread'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()
                        )}
                    </div>
                </div>

                <div className={`${styles.chatArea} ${activeConversation ? styles.showMobile : ''}`}>
                    {activeConversation ? (
                        <>
                            <div className={styles.chatHeader}>
                                <button 
                                    className={styles.backButton} 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        closingRef.current = true;
                                        setActiveConversation(null);
                                        setTimeout(() => {
                                            closingRef.current = false;
                                        }, 400); // Standard mobile click delay
                                    }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                {(() => {
                                    const isUserBuyer = activeConversation.buyer.id === user.id;
                                    const otherParticipant = isUserBuyer ? activeConversation.seller : activeConversation.buyer;
                                    const participantName = otherParticipant.full_name || otherParticipant.email || 'Unknown';

                                    return (
                                        <>
                                            <div className={styles.avatar}>
                                                {otherParticipant.profile_picture ? (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                                        <Image 
                                                            src={otherParticipant.profile_picture.startsWith('http') ? otherParticipant.profile_picture : `${BASE_URL}${otherParticipant.profile_picture}`} 
                                                            alt={participantName} 
                                                            fill 
                                                            style={{ objectFit: 'cover' }}
                                                            sizes="40px"
                                                        />
                                                    </div>
                                                ) : (
                                                    getInitials(otherParticipant.full_name, otherParticipant.email)
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <h2 className={styles.participantName} style={{ fontSize: '16px' }}>{participantName}</h2>
                                                    {activeConversation.listing.status === 'pending' && (
                                                        <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending Sale</span>
                                                    )}
                                                    {activeConversation.listing.status === 'sold' && (
                                                        <span className={`${styles.statusBadge} ${styles.statusSold}`}>Sold</span>
                                                    )}
                                                </div>
                                                <p 
                                                    className={styles.listingInfo} 
                                                    style={{ color: 'var(--vandy-gold)', cursor: 'pointer', fontWeight: 'bold' }}
                                                    onClick={() => setIsDetailModalOpen(true)}
                                                >
                                                    {activeConversation.listing.title} • ${activeConversation.listing.price}
                                                </p>
                                            </div>
                                            
                                            {activeConversation.listing.status === 'pending' && (() => {
                                                const sellerConfirmed = activeConversation.listing.seller_confirmed_sold;
                                                const buyerConfirmed = activeConversation.listing.buyer_confirmed_sold;
                                                const isSeller = activeConversation.seller.id === user.id;
                                                const isBuyer = activeConversation.buyer.id === user.id;
                                                
                                                // Waiting state: seller has confirmed, waiting for buyer
                                                if (sellerConfirmed && !buyerConfirmed) {
                                                    return (
                                                        <div className={styles.transactionActions}>
                                                            {isBuyer ? (
                                                                <button
                                                                    className={`${styles.transactionBtn} ${styles.completeBtn}`}
                                                                    onClick={handleCompleteTransaction}
                                                                    disabled={transacting}
                                                                >
                                                                    {transacting ? '...' : 'Confirm Receipt'}
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '600', background: '#fef3c7', padding: '8px 14px', borderRadius: '8px' }}>
                                                                    ⏳ Waiting for buyer to confirm receipt
                                                                </span>
                                                            )}
                                                            {isSeller && (
                                                                <button
                                                                    className={`${styles.transactionBtn} ${styles.cancelBtn}`}
                                                                    onClick={handleCancelTransaction}
                                                                    disabled={transacting}
                                                                    style={{ marginLeft: '8px' }}
                                                                >
                                                                    {transacting ? '...' : 'Cancel'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Default: show action buttons
                                                return (
                                                    <div className={styles.transactionActions}>
                                                        {isSeller ? (
                                                            <>
                                                                <button
                                                                    className={`${styles.transactionBtn} ${styles.completeBtn}`}
                                                                    onClick={handleCompleteTransaction}
                                                                    disabled={transacting}
                                                                >
                                                                    {transacting ? '...' : 'Complete Transaction'}
                                                                </button>
                                                                <button
                                                                    className={`${styles.transactionBtn} ${styles.cancelBtn}`}
                                                                    onClick={handleCancelTransaction}
                                                                    disabled={transacting}
                                                                >
                                                                    {transacting ? '...' : 'Cancel'}
                                                                </button>
                                                            </>
                                                        ) : isBuyer ? (
                                                            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', background: '#f3f4f6', padding: '8px 14px', borderRadius: '8px' }}>
                                                                Offer accepted — awaiting seller confirmation
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Transaction status banner */}
                            {transactionStatus && (
                                <div style={{
                                    padding: '10px 24px',
                                    backgroundColor: transactionStatus.startsWith('error:') ? '#fef2f2' : transactionStatus === 'cancelled' ? '#fffbeb' : '#f0fdf4',
                                    borderBottom: '1px solid #e5e7eb',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: transactionStatus.startsWith('error:') ? '#dc2626' : transactionStatus === 'cancelled' ? '#d97706' : '#16a34a',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>
                                        {transactionStatus.startsWith('error:') 
                                            ? `⚠️ ${transactionStatus.replace('error:', '')}`
                                            : transactionStatus === 'cancelled'
                                            ? '✅ Offer cancelled — listing is back on the market'
                                            : '✅ Transaction confirmed — listing marked as sold'}
                                    </span>
                                    <button onClick={() => setTransactionStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                </div>
                            )}

                            <div className={styles.messageList}>
                                {messages.map((msg) => {
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
                                {activeConversation.buyer.id === user.id && (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsOfferMode(!isOfferMode)}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
                                            backgroundColor: isOfferMode ? '#ecfeff' : '#f3f4f6',
                                            color: isOfferMode ? '#06b6d4' : '#6b7280',
                                            fontWeight: '800',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Make an Offer"
                                    >
                                        $
                                    </button>
                                )}
                                <input
                                    type={isOfferMode ? "number" : "text"}
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isOfferMode ? "Enter offer amount..." : "Type a message..."}
                                    className={styles.chatInput}
                                    min={isOfferMode ? "0" : undefined}
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

            {activeConversation && isDetailModalOpen && (
                <ProductDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    listing={{
                        ...activeConversation.listing,
                        image: activeConversation.listing.images && activeConversation.listing.images.length > 0 ? activeConversation.listing.images[0] : undefined,
                        timeAgo: getTimeAgo(activeConversation.listing.created_at)
                    }}
                    onListingDeleted={() => {
                        setIsDetailModalOpen(false);
                    }}
                    hideActions={true}
                />
            )}

            <BottomNav />
            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
