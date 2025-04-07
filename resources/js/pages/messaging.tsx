import { Head, usePage, useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EncryptionNotice } from '@/components/encryption-notice';
import UserAvatar from '@/components/user-avatar';
import { getPrivateKeyFromCookie, encryptMessage, decryptMessage, generateKeyPair, savePrivateKeyToFile, savePrivateKeyToCookie, isValidPrivateKey } from '@/utils/crypto';
import axios from 'axios';
import { Loader2, Lock, File, FileText, X, MessageSquare, Shield, Key, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    ArrowPathIcon, 
    ArrowLeftIcon, 
    PaperClipIcon,
    TrashIcon,
    LockClosedIcon, 
    UsersIcon,
    ChatBubbleLeftIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { type SharedData } from '@/types';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Messages',
        href: '/messages',
    },
];

interface User {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
    isCurrentUser?: boolean;
    isFriend?: boolean;
    public_key?: string;
}

interface MessageUser {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
}

interface DirectMessage {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
    expires_at: string;
    attachments?: MessageAttachment[];
    is_encrypted?: boolean;
    decrypted_content?: string;
    original_content?: string;
}

interface GroupMessage {
    id: number;
    content: string;
    user_id: number;
    created_at: string;
    user: MessageUser;
    attachments?: MessageAttachment[];
    is_encrypted?: boolean;
    original_content?: string;
}

type Message = DirectMessage | GroupMessage;

interface MessageAttachment {
    id: number;
    file_path: string;
    file_type: string;
    file_name: string;
    file_size: number;
}

interface AllUser {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
    public_key?: string;
}

interface Group {
    id: string;
    name: string;
    avatar: string | null;
    isGroup: true;
    members: Array<{
        id: number;
        name: string;
        avatar: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
    }>;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
    created_by?: number; // Admin/creator of the group
}

type Chat = User | Group;

function isGroup(chat: Chat | null): chat is Group {
    return chat !== null && 'isGroup' in chat && chat.isGroup;
}

interface MessagingProps {
    users: User[];
    groups: Group[];
    allUsers: AllUser[];
}

const isGroupMessage = (message: any): message is GroupMessage => {
    return message && 'user_id' in message;
};

const isDirectMessage = (message: any): message is DirectMessage => {
    return message && 'sender_id' in message;
};

export default function Messaging(props: MessagingProps) {
    const { users: initialUsers = [], groups: initialGroups = [], allUsers: initialAllUsers = [] } = props;
    const { auth } = usePage<SharedData>().props;
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [expiresIn] = useState(24);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [message, setMessage] = useState('');
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [isEncryptionSetupOpen, setIsEncryptionSetupOpen] = useState(false);
    const [hasEncryptionKeys, setHasEncryptionKeys] = useState(false);
    const [, setShowEncryptionSetup] = useState(false);
    const [isEncryptionToggled, setIsEncryptionToggled] = useState(false);
    const [showEncryptionWarning] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showRefreshNotice, setShowRefreshNotice] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [allUsers, setAllUsers] = useState<AllUser[]>(initialAllUsers);

    const { reset } = useForm({
        content: '',
        expires_in: 24,
    });

    useEffect(() => {
        const privateKey = getPrivateKeyFromCookie();
        const hasKeys = !!privateKey;
        setHasEncryptionKeys(hasKeys);
        
        if (!hasKeys) {
            const timer = setTimeout(() => {
                setShowEncryptionSetup(true);
                setIsEncryptionSetupOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const selectedChatHasPublicKey = useMemo(() => {
        if (!selectedChat || isGroup(selectedChat)) return false;
        return !!selectedChat.public_key;
    }, [selectedChat]);

    useEffect(() => {
        if (!selectedChat) return;
        
        setLoading(true);
        setMessages([]);
        // Reset encryption state only when changing chats
        // When a user has a public key, encryption will be enabled by default
        setIsEncrypted(false);
        setIsEncryptionToggled(false);
        
        const endpoint = isGroup(selectedChat)
            ? route('groups.messages', selectedChat.id.replace('group_', ''))
            : route('messages.get', selectedChat.id);

        axios.get(endpoint)
            .then((response) => {
                const loadedMessages = response.data.messages || [];
                
                if (!isGroup(selectedChat)) {
                    const privateKey = getPrivateKeyFromCookie();
                    
                    const processedMessages = loadedMessages.map((message: DirectMessage) => {
                        // If this is an encrypted message sent by the current user
                        if (message.is_encrypted && message.sender_id === auth.user?.id) {
                            // For self-messages (when sender and receiver are the same user)
                            const isSelfMessage = selectedChat.id === auth.user?.id;
                            
                            // For self-messages, attempt to decrypt
                            if (isSelfMessage) {
                                if (privateKey) {
                                    try {
                                        const decryptedContent = decryptMessage(message.content, privateKey);
                                        return {
                                            ...message,
                                            decrypted_content: decryptedContent
                                        };
                                    } catch (error) {
                                        console.error('Failed to decrypt self-message:', error);
                                        // Even if decryption fails, for self-messages show the content
                                        return {
                                            ...message,
                                            decrypted_content: message.content
                                        };
                                    }
                                }
                            }
                            
                            return {
                                ...message,
                                decrypted_content: "[Encrypted Message]"
                            };
                        }
                        
                        // If message is encrypted and we have a private key, try to decrypt
                        if (message.is_encrypted && message.sender_id !== auth.user?.id) {
                            if (privateKey) {
                                try {
                                    const decryptedContent = decryptMessage(message.content, privateKey);
                                    return {
                                        ...message,
                                        decrypted_content: decryptedContent
                                    };
                                } catch (error) {
                                    console.error('Failed to decrypt message:', error);
                                    return {
                                        ...message,
                                        decrypted_content: "[Unable to decrypt message]"
                                    };
                                }
                            }
                        }
                        
                        return message;
                    });
                    
                    setMessages(processedMessages);
                    
                    if (response.data.user && response.data.user.public_key) {
                        // Update the public key in our users array
                        setUsers(prevUsers => 
                            prevUsers.map(user => 
                                user.id === selectedChat.id 
                                    ? { ...user, public_key: response.data.user.public_key } 
                                    : user
                            )
                        );
                        
                        // Update the selected chat's public key
                        setSelectedChat((prevChat) => {
                            if (!prevChat || isGroup(prevChat)) return prevChat;
                            return { ...prevChat, public_key: response.data.user.public_key };
                        });
                        
                        // If the recipient has a public key and we have our own private key,
                        // enable encryption by default only if user hasn't explicitly toggled it
                        if (hasEncryptionKeys && !isGroup(selectedChat) && !isEncryptionToggled) {
                            setIsEncrypted(true);
                        }
                    }
                } else {
                    // For group chats
                    setMessages(loadedMessages);
                    
                    // Update the group data if it has changed (including created_by)
                    if (response.data.group) {
                        setSelectedChat(prevChat => {
                            if (!prevChat || !isGroup(prevChat)) return prevChat;
                            
                            return {
                                ...prevChat,
                                created_by: response.data.group.created_by,
                                members: response.data.group.users || prevChat.members
                            };
                        });
                        
                        // Also update the groups list
                        setGroups(prevGroups => 
                            prevGroups.map(group => 
                                group.id === selectedChat.id
                                    ? { 
                                        ...group, 
                                        created_by: response.data.group.created_by,
                                        members: response.data.group.users || group.members
                                    } 
                                    : group
                            )
                        );
                    }
                }
                
                scrollToBottom();
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedChat ? (isGroup(selectedChat) ? `group_${selectedChat.id}` : selectedChat.id) : null, hasEncryptionKeys]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (auth.user && !users.some(user => user.id === auth.user.id)) {
            const currentUser: User = {
                id: auth.user.id,
                name: auth.user.name,
                username: auth.user.username as string,
                avatar: auth.user.avatar || null,
                verification_status: (typeof auth.user.verification_status === 'string' &&
                    ['unverified', 'pending', 'verified'].includes(auth.user.verification_status as string))
                    ? (auth.user.verification_status as 'unverified' | 'pending' | 'verified')
                    : undefined,
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: 0,
                isCurrentUser: true
            };
            setUsers(prevUsers => [currentUser, ...prevUsers]);
        }
    }, [auth.user, users]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChat || (!message.trim() && !selectedFiles.length)) return;
        
        if (isSending) return;
        
        setIsSending(true);

        if (isEncrypted && isGroup(selectedChat)) {
            alert('Encryption is only supported for direct messages');
            setIsSending(false);
            return;
        }

        const formData = new FormData();
        let contentToSend = message;
        const isContentEncrypted = isEncrypted && !isGroup(selectedChat);
        const originalContent = message;
        const isSelfMessage = !isGroup(selectedChat) && selectedChat.id === auth.user?.id;

        if (isContentEncrypted) {
            let recipientPublicKey = selectedChat.public_key;
            
            if (!recipientPublicKey) {
                try {
                    recipientPublicKey = await ensurePublicKey(selectedChat.id);
                    
                    if (!recipientPublicKey) {
                        alert('Cannot send encrypted message: recipient has no public key');
                        setIsSending(false);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching public key:', error);
                    alert('Failed to fetch recipient\'s public key');
                    setIsSending(false);
                    return;
                }
            }
            
            try {
                // For self-messages, we'll still encrypt but ensure we can display it
                contentToSend = encryptMessage(message, recipientPublicKey);
                formData.append('is_encrypted', '1');
            } catch (error) {
                console.error('Encryption error:', error);
                alert('Failed to encrypt message');
                setIsSending(false);
                return;
            }
        }

        formData.append('content', contentToSend);
        selectedFiles.forEach((file) => {
            formData.append('attachments[]', file);
        });

        const tempMessage = message;
        const tempTime = new Date().toISOString();
        
        setMessage('');
        setSelectedFiles([]);
        
        if (!isGroup(selectedChat)) {
            const optimisticMessage: DirectMessage = {
                id: -Date.now(),
                content: isContentEncrypted ? contentToSend : tempMessage,
                sender_id: auth.user?.id || 0,
                created_at: tempTime,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                is_encrypted: isContentEncrypted,
                // For self-messages, always show the original content
                decrypted_content: isSelfMessage ? originalContent : (isContentEncrypted ? originalContent : undefined),
                original_content: originalContent,
            };
            
            setMessages(prev => [...prev, optimisticMessage]);
            scrollToBottom();
        }

        try {
            const endpoint = isGroup(selectedChat)
                ? route('groups.message', selectedChat.id.replace('group_', ''))
                : route('messages.send', selectedChat.id);

            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            let messageData = response.data.message;
            if (messageData.is_encrypted && messageData.sender_id === auth.user?.id) {
                // For self-messages (when sender and receiver are the same user)
                const isSelfMessage = selectedChat.id === auth.user?.id;
                
                if (isSelfMessage) {
                    // Try to decrypt the content for self-messages
                    const privateKey = getPrivateKeyFromCookie();
                    if (privateKey) {
                        try {
                            const decryptedContent = decryptMessage(messageData.content, privateKey);
                            messageData = {
                                ...messageData,
                                decrypted_content: decryptedContent,
                                original_content: originalContent
                            };
                        } catch (error) {
                            console.error('Failed to decrypt sent self-message:', error);
                            messageData = {
                                ...messageData,
                                decrypted_content: messageData.content,
                                original_content: originalContent
                            };
                        }
                    } else {
                        messageData = {
                            ...messageData,
                            decrypted_content: messageData.content,
                            original_content: originalContent
                        };
                    }
                } else {
                    messageData = {
                        ...messageData,
                        decrypted_content: originalContent,
                        original_content: originalContent
                    };
                }
            }

            setMessages((prev) => {
                const filteredMessages = prev.filter(msg => 
                    !('sender_id' in msg) || msg.id > 0
                );
                
                return [...filteredMessages, messageData];
            });
            
            if (isGroup(selectedChat)) {
                setGroups((currentGroups) =>
                    currentGroups.map((group) =>
                        group.id === selectedChat.id ? { ...group, lastMessage: tempMessage, lastMessageTime: 'Just now' } : group,
                    ),
                );
            } else {
                setUsers((currentUsers) =>
                    currentUsers.map((user) =>
                        user.id === selectedChat.id ? { ...user, lastMessage: tempMessage, lastMessageTime: 'Just now' } : user,
                    ),
                );
            }

            reset('content');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Show better error messaging to the user
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    alert('You do not have permission to send this message');
                } else if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Failed to send message. Please try again.');
                }
            } else {
                alert('An unexpected error occurred. Please try again.');
            }
            
            setMessage(tempMessage);
            setMessages(prev => prev.filter(msg => msg.id > 0));
        } finally {
            setIsSending(false);
        }
    };

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUsers.length < 2 || !groupName.trim()) return;

        try {
            const formData = new FormData();
            formData.append('name', groupName);
            selectedUsers.forEach((userId) => {
                formData.append('users[]', userId.toString());
            });

            const response = await axios.post(route('groups.create'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            const newGroup = response.data.group;

            const group: Group = {
                id: `group_${newGroup.id}`,
                name: newGroup.name,
                avatar: newGroup.avatar,
                isGroup: true,
                members: newGroup.users,
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: 0,
                created_by: newGroup.created_by
            };

            setGroups((currentGroups) => [group, ...currentGroups]);

            setIsNewGroupOpen(false);
            setSelectedUsers([]);
            setGroupName('');
        } catch (error) {
            console.error('Error creating group:', error);
            
            // Show better error messaging to the user
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    alert('You do not have permission to create a group');
                } else if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Failed to create group. Please try again.');
                }
            } else {
                alert('An unexpected error occurred. Please try again.');
            }
        }
    };

    const addMembersToGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUsers.length === 0 || !selectedChat || !isGroup(selectedChat)) return;

        try {
            const groupId = selectedChat.id.replace('group_', '');
            const formData = new FormData();
            selectedUsers.forEach((userId) => {
                formData.append('users[]', userId.toString());
            });
            
            const response = await axios.post(route('groups.add-members', { group: groupId }), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            const updatedGroup = response.data.group;

            // Update the group in the state
            setGroups((currentGroups) =>
                currentGroups.map((group) =>
                    group.id === selectedChat.id
                        ? {
                              ...group,
                              members: updatedGroup.users,
                          }
                        : group
                )
            );

            // Update the selected chat
            setSelectedChat((prevChat) => {
                if (prevChat && isGroup(prevChat)) {
                    return {
                        ...prevChat,
                        members: updatedGroup.users,
                    };
                }
                return prevChat;
            });

            setIsAddMembersOpen(false);
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error adding members to group:', error);
            
            // Show better error messaging to the user
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    alert('You do not have permission to add members to this group');
                } else if (error.response?.data?.message) {
                    alert(`Error: ${error.response.data.message}`);
                } else {
                    alert('Failed to add members to group. Please try again.');
                }
            } else {
                alert('An unexpected error occurred. Please try again.');
            }
        }
    };

    allUsers.filter(
        (user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    const startNewConversation = async (user: {
        id: number;
        name: string;
        username: string;
        avatar: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
        public_key?: string;
    }) => {
        const newUser: User = {
            ...user,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0,
        };
        
        if (!user.public_key) {
            try {
                await axios.get(route('messages.get', user.id));
                const existingUser = users.find(u => u.id === user.id);
                if (existingUser && existingUser.public_key) {
                    newUser.public_key = existingUser.public_key;
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        setSelectedChat(newUser);
        setIsNewMessageOpen(false);
    };

    const isCurrentUserMessage = (message: DirectMessage): boolean => {
        if (!auth.user) return false;
        return message.sender_id === auth.user.id;
    };

    const isCurrentUserGroupMessage = (message: GroupMessage): boolean => {
        if (!auth.user) return false;
        return message.user_id === auth.user.id;
    };

    const handleDeleteMessage = (messageId: number, isGroupMsg: boolean = false) => {
        if (!selectedChat) return;

        setMessages((prevMessages) => prevMessages.filter((message) => message.id !== messageId));

        // Use different routes based on message type
        const route_name = isGroupMsg ? 'group-messages.destroy' : 'messages.destroy';
        
        router.delete(route(route_name, messageId), {
            preserveScroll: true,
            onError: () => {
                setMessages((prevMessages) => [...prevMessages]);
            },
        });
    };

    /**
     * Ensures we have a public key for the specified user.
     * Checks local state first, then fetches from server if needed.
     */
    const ensurePublicKey = async (userId: number): Promise<string | undefined> => {
        // First check if we already have the public key in our current state
        const user = users.find(u => u.id === userId);
        if (user?.public_key) {
            return user.public_key;
        }
        
        // Try to find in allUsers array as well
        const allUser = allUsers.find(u => u.id === userId);
        if (allUser && 'public_key' in allUser && allUser.public_key) {
            // Update our main users array
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === userId ? { ...u, public_key: allUser.public_key } : u
                )
            );
            
            // Update selected chat if this is the current one
            if (selectedChat && !isGroup(selectedChat) && selectedChat.id === userId) {
                setSelectedChat({
                    ...selectedChat,
                    public_key: allUser.public_key
                });
            }
            
            return allUser.public_key;
        }
        
        // If we don't have it locally, fetch from server
        try {
            const response = await axios.get(route('messages.get', userId));
            
            if (response.data.user && response.data.user.public_key) {
                const fetchedPublicKey = response.data.user.public_key;
                
                // Update our users cache
                setUsers(prevUsers => 
                    prevUsers.map(u => 
                        u.id === userId ? { ...u, public_key: fetchedPublicKey } : u
                    )
                );
                
                // Update allUsers array with type assertion
                setAllUsers(prevAllUsers => 
                    prevAllUsers.map(u => 
                        u.id === userId 
                            ? { ...u, public_key: fetchedPublicKey } as AllUser
                            : u
                    )
                );
                
                // Update selected chat if this is the current one
                if (selectedChat && !isGroup(selectedChat) && selectedChat.id === userId) {
                    setSelectedChat({
                        ...selectedChat,
                        public_key: fetchedPublicKey
                    });
                }
                
                return fetchedPublicKey;
            }
            
            // User has no public key
            console.warn(`User ${userId} has no public key`);
            return undefined;
        } catch (error) {
            console.error('Error fetching user public key:', error);
            throw error;
        }
    };

    const toggleEncryption = async () => {
        // If this is a group chat, encryption isn't supported
        if (isGroup(selectedChat)) {
            console.warn('Encryption not supported for group chats');
            return;
        }
        
        // Ensure we have our own private key
        const privateKey = getPrivateKeyFromCookie();
        if (!privateKey) {
            setIsEncryptionSetupOpen(true);
            return;
        }
        
        // Ensure the recipient has a public key
        if (!selectedChat?.public_key) {
            // Try to fetch the latest public key in case it was recently created
            try {
                if (selectedChat) {
                    const updatedPublicKey = await ensurePublicKey(selectedChat.id);
                    if (!updatedPublicKey) {
                        alert(`Encryption unavailable: ${selectedChat.name} hasn't set up encryption yet.`);
                        return;
                    }
                }
            } catch (error) {
                console.error('Error checking public key:', error);
                alert('Encryption unavailable: Could not verify recipient encryption setup.');
                return;
            }
        }
        
        // Toggle encryption state
        setIsEncrypted(!isEncrypted);
        setIsEncryptionToggled(true);
    };

    const refreshMessages = () => {
        if (!selectedChat) return;
        
        setShowRefreshNotice(false);
        setRefreshing(true);
        
        // Different endpoints for group vs direct messages
        const endpoint = isGroup(selectedChat)
            ? route('groups.messages', selectedChat.id.replace('group_', ''))
            : route('messages.get', selectedChat.id);
        
        axios.get(endpoint)
            .then(response => {
                const loadedMessages = response.data.messages || [];
                
                if (!isGroup(selectedChat)) {
                    // Process direct messages for encryption
                    const processedMessages = loadedMessages.map((message: DirectMessage) => {
                        // If this is an encrypted message sent by the current user
                        if (message.is_encrypted && message.sender_id === auth.user?.id) {
                            // For self-messages (when sender and receiver are the same user)
                            const isSelfMessage = selectedChat.id === auth.user?.id;
                            
                            // For self-messages, attempt to decrypt
                            if (isSelfMessage) {
                                const privateKey = getPrivateKeyFromCookie();
                                if (privateKey) {
                                    try {
                                        const decryptedContent = decryptMessage(message.content, privateKey);
                                        return {
                                            ...message,
                                            decrypted_content: decryptedContent
                                        };
                                    } catch (error) {
                                        console.error('Failed to decrypt self-message:', error);
                                        // Even if decryption fails, for self-messages show the content
                                        return {
                                            ...message,
                                            decrypted_content: message.content
                                        };
                                    }
                                }
                            }
                            
                            return {
                                ...message,
                                decrypted_content: "[Encrypted Message]"
                            };
                        }
                        
                        // If message is encrypted and we have a private key, try to decrypt
                        if (message.is_encrypted && message.sender_id !== auth.user?.id) {
                            const privateKey = getPrivateKeyFromCookie();
                            if (privateKey) {
                                try {
                                    const decryptedContent = decryptMessage(message.content, privateKey);
                                    return {
                                        ...message,
                                        decrypted_content: decryptedContent
                                    };
                                } catch (error) {
                                    console.error('Failed to decrypt message:', error);
                                    return {
                                        ...message,
                                        decrypted_content: "[Unable to decrypt message]"
                                    };
                                }
                            }
                        }
                        
                        return message;
                    });
                    
                    setMessages(processedMessages);
                    
                    // Update the user's public key information from the response
                    // This ensures the encryption lock button becomes available when a user has setup encryption
                    if (response.data.user && response.data.user.public_key) {
                        const fetchedPublicKey = response.data.user.public_key;
                        
                        // Update the public key in the users array
                        setUsers(prevUsers => 
                            prevUsers.map(user => 
                                user.id === selectedChat.id 
                                    ? { ...user, public_key: fetchedPublicKey } 
                                    : user
                            )
                        );
                        
                        // Update the selected chat's public key
                        setSelectedChat((prevChat) => {
                            if (!prevChat || isGroup(prevChat)) return prevChat;
                            return { ...prevChat, public_key: fetchedPublicKey };
                        });

                        // Also update the public key in the allUsers array for completeness
                        setAllUsers(prevAllUsers => 
                            prevAllUsers.map(u => 
                                u.id === selectedChat.id 
                                    ? { ...u, public_key: fetchedPublicKey } as AllUser
                                    : u
                            )
                        );
                        
                        // If the recipient has a public key and we have our own private key,
                        // enable encryption by default only if user hasn't explicitly toggled it
                        if (hasEncryptionKeys && !isGroup(selectedChat) && !isEncryptionToggled) {
                            setIsEncrypted(true);
                        }
                    }
                } else {
                    // For group messages, just set them directly
                    setMessages(loadedMessages);
                }
                
                // Show refresh notification
                setRefreshing(false);
                setShowRefreshNotice(true);
                setTimeout(() => {
                    setShowRefreshNotice(false);
                }, 2000);
                
                // Scroll to bottom to show newest messages
                scrollToBottom();
            })
            .catch(error => {
                console.error('Error refreshing messages:', error);
                setRefreshing(false);
            });
    };

    const handleEncryptionSetup = () => {
        console.log('Encryption setup button clicked');
        // Force both state variables to true
        setIsEncryptionSetupOpen(true);
        setShowEncryptionSetup(true);
        console.log('Dialog state updated:', { isEncryptionSetupOpen: true, showEncryptionSetup: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} fullWidth={true}>
            <Head title="Messages" />
            
            <Dialog open={isEncryptionSetupOpen} onOpenChange={setIsEncryptionSetupOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            End-to-End Encryption Setup
                        </DialogTitle>
                        <DialogDescription>
                            Set up encryption for secure private messages that only you and your recipient can read.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        <Alert className="mb-4 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>One-time setup:</strong> Messages will be encrypted using public key cryptography.
                                Your private key will never be stored on our servers and is only used on your device.
                            </AlertDescription>
                        </Alert>
                        
                        <Tabs defaultValue="generate">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="generate">Generate New Keys</TabsTrigger>
                                <TabsTrigger value="upload">Use Existing Key</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="generate" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Generate a new encryption key pair. Your private key will be downloaded 
                                        automatically - <strong>keep it secure</strong> as it won't be stored on our servers.
                                    </p>
                                    
                                    <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                                                <Key className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium">New Encryption Keys</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Public key is stored on server, private key stays on your device
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={async () => {
                                        try {
                                            // Generate new key pair
                                            const { publicKey, privateKey } = await generateKeyPair();
                                            
                                            // Get current username for the filename
                                            let username = '';
                                            if (auth?.user?.username && typeof auth.user.username === 'string') {
                                                username = auth.user.username;
                                            }
                                            
                                            // Save private key as a file for the user to backup
                                            savePrivateKeyToFile(privateKey, username);
                                            
                                            // Temporarily store in cookie for encryption operations
                                            savePrivateKeyToCookie(privateKey);
                                            
                                            // Submit public key to server
                                            await axios.post(route('user.update-public-key'), {
                                                public_key: publicKey
                                            });
                                            
                                            // Update state
                                            setHasEncryptionKeys(true);
                                            setIsEncryptionSetupOpen(false);
                                            setShowEncryptionSetup(false);
                                            
                                        } catch (error) {
                                            console.error('Error generating keys:', error);
                                            
                                            // Show better error messaging to the user
                                            if (axios.isAxiosError(error)) {
                                                if (error.response?.status === 403) {
                                                    alert('You do not have permission to update your encryption keys');
                                                } else if (error.response?.data?.message) {
                                                    alert(`Error: ${error.response.data.message}`);
                                                } else {
                                                    alert('Failed to complete encryption setup. Please try again.');
                                                }
                                            } else {
                                                alert('An unexpected error occurred during encryption setup. Please try again.');
                                            }
                                        }
                                    }}
                                    className="w-full"
                                >
                                    Generate and Download Keys
                                </Button>
                            </TabsContent>
                            
                            <TabsContent value="upload" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        If you already have a private key from a previous setup, paste it below.
                                    </p>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="privateKey">Your Private Key</Label>
                                        <Textarea 
                                            id="privateKey"
                                            placeholder="Paste your private key here (begins with -----BEGIN RSA PRIVATE KEY-----)"
                                            className="font-mono text-xs h-40"
                                            rows={5}
                                            onChange={(e) => {
                                                // Store the private key text in a local variable
                                                const privateKeyText = e.target.value;
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={async () => {
                                        // Get the private key from the textarea
                                        const privateKeyTextarea = document.getElementById('privateKey') as HTMLTextAreaElement;
                                        const privateKey = privateKeyTextarea?.value;
                                        
                                        if (!privateKey || !privateKey.trim()) {
                                            alert('Please enter your private key');
                                            return;
                                        }
                                        
                                        try {
                                            // Validate if the entered key is a valid RSA private key
                                            if (!isValidPrivateKey(privateKey)) {
                                                alert('Invalid private key format');
                                                return;
                                            }
                                            
                                            // Store the private key in a cookie
                                            savePrivateKeyToCookie(privateKey);
                                            
                                            // Update state
                                            setHasEncryptionKeys(true);
                                            setIsEncryptionSetupOpen(false);
                                            setShowEncryptionSetup(false);
                                        } catch (error) {
                                            console.error('Error processing private key:', error);
                                            alert('Error processing private key');
                                        }
                                    }}
                                    className="w-full"
                                >
                                    Use This Private Key
                                </Button>
                            </TabsContent>
                        </Tabs>
                        
                        <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium">Important Security Note</h4>
                                    <p className="mt-1 text-xs">
                                        Your private key is the only way to decrypt messages sent to you. If you lose it, you won't be able to read encrypted messages. Store it securely and consider backing it up in a password manager.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <div className="flex h-[calc(100vh-4rem)] flex-1 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                {/* Left sidebar - completely fixed and independent */}
                <div className={`${isMobileView && selectedChat ? 'hidden' : 'block'} fixed left-0 top-[64px] bottom-0 z-10 w-80 overflow-hidden border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-black ${isMobileView ? 'w-full' : ''}`}>
                    {/* Header with buttons */}
                    <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-center gap-4 pb-2">
                                    <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-900 rounded-2xl gap-4 shadow-sm">
                                        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className={`h-12 w-12 rounded-xl bg-white border-gray-100 shadow-sm hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-all flex items-center justify-center ${isNewMessageOpen ? 'ring-2 ring-blue-500 text-blue-600 dark:ring-blue-400 dark:text-blue-400' : ''}`}
                                                    title="New message"
                                                >
                                                    <ChatBubbleLeftIcon className={`h-5 w-5 ${isNewMessageOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>New Message</DialogTitle>
                                                </DialogHeader>
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <Label>Find User</Label>
                                                        <Input
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            placeholder="Search by name or username"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div className="max-h-[60vh] space-y-1 overflow-y-auto">
                                                        {allUsers
                                                            .filter((user) => {
                                                                const normalizedQuery = searchQuery.toLowerCase();
                                                                return (
                                                                    user.name.toLowerCase().includes(normalizedQuery) ||
                                                                    user.username.toLowerCase().includes(normalizedQuery)
                                                                );
                                                            })
                                                            .map((user) => (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => startNewConversation(user)}
                                                                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900"
                                                                >
                                                                    <UserAvatar user={user} className="size-10" />
                                                                    <div>
                                                                        <p className="font-medium">{user.name}</p>
                                                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className={`h-12 w-12 rounded-xl bg-white border-gray-100 shadow-sm hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-all flex items-center justify-center ${isNewGroupOpen ? 'ring-2 ring-blue-500 text-blue-600 dark:ring-blue-400 dark:text-blue-400' : ''}`}
                                                    title="Create group"
                                                >
                                                    <UsersIcon className={`h-5 w-5 ${isNewGroupOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Create New Group</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={createGroup} className="mt-4 space-y-4">
                                                    <div>
                                                        <Label htmlFor="groupName">Group Name</Label>
                                                        <Input
                                                            id="groupName"
                                                            value={groupName}
                                                            onChange={(e) => setGroupName(e.target.value)}
                                                            placeholder="Enter group name"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Select Members</Label>
                                                        <div className="mt-2 max-h-[40vh] space-y-2 overflow-y-auto rounded-md border p-2">
                                                            {allUsers.map((user) => (
                                                                <label
                                                                    key={user.id}
                                                                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                >
                                                                    <Checkbox
                                                                        checked={selectedUsers.includes(user.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            setSelectedUsers((current) =>
                                                                                checked ? [...current, user.id] : current.filter((id) => id !== user.id),
                                                                            );
                                                                        }}
                                                                    />
                                                                    <UserAvatar user={user} className="size-8" />
                                                                    <span className="text-foreground">{user.name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button type="submit" disabled={selectedUsers.length < 2 || !groupName.trim()}>
                                                            Create Group
                                                        </Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        <Button 
                                            variant="outline" 
                                            className={`h-12 w-12 rounded-xl bg-white border-gray-100 shadow-sm hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-all flex items-center justify-center relative ${isEncryptionSetupOpen ? 'ring-2 ring-blue-500 text-blue-600 dark:ring-blue-400 dark:text-blue-400' : ''}`}
                                            title="Encryption setup"
                                            onClick={handleEncryptionSetup}
                                        >
                                            <LockClosedIcon className={`h-5 w-5 ${isEncryptionSetupOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} />
                                            {!hasEncryptionKeys && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                                    !
                                                </span>
                                            )}
                                        </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable chat list container */}
                    <div className="h-[calc(100%-6rem)] overflow-y-auto">
                        <div className="space-y-1 p-2">
                            <EncryptionNotice className="mb-2" />
                            {(() => {
                                const filteredChats = [...users, ...groups]
                                    .filter(chat => {
                                        // Always show the current user (self)
                                        if ('isCurrentUser' in chat && chat.isCurrentUser) return true;
                                        // Always show all groups
                                        if ('isGroup' in chat && chat.isGroup) return true;
                                        // For regular users, only show if they have lastMessage
                                        return !!chat.lastMessage;
                                    })
                                .sort((a, b) => {
                                    if ('isCurrentUser' in a && a.isCurrentUser) return -1;
                                    if ('isCurrentUser' in b && b.isCurrentUser) return 1;

                                    if (!a.lastMessageTime) return 1;
                                    if (!b.lastMessageTime) return -1;
                                    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
                                    });

                                if (filteredChats.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center p-8 text-center">
                                            <MessageSquare className="h-10 w-10 mb-3 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400 font-medium">No conversations yet</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                Start a new conversation using the buttons above
                                            </p>
                                        </div>
                                    );
                                }

                                return filteredChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900 ${
                                            selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-900' : ''
                                        }`}
                                    >
                                        {isGroup(chat) ? (
                                            <div className="relative">
                                                <UserAvatar user={{ name: chat.name, avatar: chat.avatar }} className="size-12" />
                                                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                    {chat.members.length}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <UserAvatar user={chat} className="size-12" />
                                                {'isCurrentUser' in chat && chat.isCurrentUser && (
                                                    <span className="-top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            className="h-3 w-3"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75-.75H13a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white">{chat.name}</p>
                                                {'isCurrentUser' in chat && chat.isCurrentUser && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                                                )}
                                                {'isFriend' in chat && chat.isFriend && (
                                                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                        Friends
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                {chat.lastMessage || (isGroup(chat) 
                                                    ? `Start chatting in ${chat.name}` 
                                                    : `Start chatting with ${chat.name}`)}
                                            </p>
                                        </div>
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                {/* Message area - with left margin to accommodate sidebar */}
                <div className={`${isMobileView ? 'w-full' : 'ml-80'} flex-1 h-full overflow-hidden relative`}>
                    {selectedChat ? (
                        <div className="flex h-full flex-col overflow-hidden">
                            {/* Fixed header - placed outside the scrollable area */}
                            <div className="fixed top-[64px] left-0 right-0 z-30 ml-0 md:ml-80">
                            {showEncryptionWarning && !isGroup(selectedChat) && (
                                <div className="p-4">
                                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                                        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <AlertTitle className="text-amber-800 dark:text-amber-400">
                                            End-to-End Encryption Not Available
                                        </AlertTitle>
                                        <AlertDescription className="text-amber-700 dark:text-amber-500">
                                            {selectedChat.name} hasn't set up encryption yet. Messages will be sent unencrypted. When they set up their keys, you'll be able to send encrypted messages.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}
                            
                                <div className="flex justify-center p-4">
                                    <div className="flex w-full max-w-3xl items-center justify-between rounded-full border px-6 py-3 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
                                    <div className="flex items-center gap-4">
                                    {isMobileView && (
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)} className="h-9 w-9 rounded-full p-0">
                                            <ArrowLeftIcon className="h-5 w-5" />
                                        </Button>
                                    )}
                                    {isGroup(selectedChat) ? (
                                            <div className="relative">
                                                <UserAvatar user={{ name: selectedChat.name, avatar: selectedChat.avatar }} className="size-10" />
                                                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                    {selectedChat.members.length}
                                                </span>
                                            </div>
                                        ) : (
                                            <UserAvatar user={selectedChat} className="size-10" />
                                        )}
                                            <div>
                                            <h2 className="text-base font-medium text-gray-900 dark:text-white">{selectedChat.name}</h2>
                                            {isGroup(selectedChat) ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {selectedChat.members.length} members
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {selectedChat.lastMessageTime ? `Active ${selectedChat.lastMessageTime}` : 'New conversation'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                            {isGroup(selectedChat) && (
                                                <Button
                                                    variant="outline"
                                                    className="mr-2 h-10 w-10 rounded-xl border border-gray-100 bg-blue-500 text-white hover:bg-blue-600 dark:border-gray-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center"
                                                    onClick={() => setIsAddMembersOpen(true)}
                                                    title="Add members to group"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </Button>
                                            )}
                                        <Button 
                                            variant="outline" 
                                            className="h-10 w-10 rounded-xl border border-gray-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center justify-center"
                                            onClick={refreshMessages} 
                                            disabled={refreshing}
                                            title="Refresh messages"
                                        >
                                            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                                {/* User buttons for group chat */}
                                {isGroup(selectedChat) && (
                                    <div className="flex justify-center -mt-2 mb-2">
                                        <div className="w-full max-w-3xl px-4">
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {selectedChat.members.map((member) => (
                                                    <div 
                                                        key={member.id}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-800/60"
                                                    >
                                                        <UserAvatar user={member} className="size-4 mr-1" />
                                                        {member.name}
                                                        {member.id === auth.user?.id && (
                                                            <span className="text-[10px] rounded-full bg-blue-200 dark:bg-blue-700 px-1.5 ml-0.5 text-blue-700 dark:text-blue-200">
                                                                you
                                                            </span>
                                                        )}
                                                        {selectedChat.created_by === member.id && (
                                                            <span className="ml-0.5 text-amber-500 dark:text-amber-300" title="Group Admin">
                                                                👑
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Messages container - with top padding to accommodate the fixed header and more bottom padding for mobile */}
                            <div className="flex-1 overflow-y-auto pt-[130px] pb-[150px] md:pb-[100px]">
                                <div className="flex min-h-full flex-col justify-end p-4">
                                            <div className="space-y-4">
                                                {showRefreshNotice && (
                                                    <div className="sticky top-0 z-10 mb-4 flex justify-center">
                                                        <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-800 shadow-md dark:bg-green-900 dark:text-green-200 transition-opacity">
                                                            <span className="text-sm">Messages refreshed</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                        {/* Message expiration notice - now shown for both direct and group messages */}
                                                    <div className="flex justify-center">
                                                        <div className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                                                            Messages will expire in {expiresIn} {expiresIn === 1 ? 'hour' : 'hours'}
                                            </div>
                                        </div>

                                        {/* Encryption advisory for direct messages */}
                                        {!isGroup(selectedChat) && !isEncrypted && selectedChat?.id !== auth.user?.id && (
                                            <div className="flex justify-center mt-2">
                                                <div className="rounded-full bg-blue-100 px-4 py-1 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                                    <Lock className="h-3 w-3 inline mr-1" />
                                                    Enable encryption for added privacy and security
                                                </div>
                                            </div>
                                        )}

                                        {/* Self-message encryption advisory */}
                                        {!isGroup(selectedChat) && !isEncrypted && selectedChat?.id === auth.user?.id && (
                                            <div className="flex justify-center mt-2">
                                                <div className="rounded-full bg-blue-100 px-4 py-1 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                                    <Lock className="h-3 w-3 inline mr-1" />
                                                    Enable encryption for secure private note-taking
                                                        </div>
                                                    </div>
                                                )}
                                            
                                            {messages.length === 0 && !loading ? (
                                                <div className="flex justify-center p-8">
                                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                                        <p>No messages yet</p>
                                                        <p className="text-sm mt-1">Start a conversation with {!isGroup(selectedChat) ? selectedChat?.name : 'the group'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                messages.map((message, index) => {
                                                    const isCurrentUser = isGroup(selectedChat)
                                                        ? isGroupMessage(message) && isCurrentUserGroupMessage(message)
                                                        : isDirectMessage(message) && isCurrentUserMessage(message);
                                                    const showAvatar = isGroup(selectedChat) && !isCurrentUser;
                                                    const prevMessage = messages[index - 1];
                                                    const isConsecutiveMessage =
                                                        prevMessage &&
                                                        isGroup(selectedChat) &&
                                                        !isCurrentUser &&
                                                        isGroupMessage(prevMessage) &&
                                                        isGroupMessage(message) &&
                                                        prevMessage.user_id === message.user_id;

                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={`mb-4 flex ${isCurrentUser || isConsecutiveMessage ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            {showAvatar && !isConsecutiveMessage && isGroupMessage(message) && (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <UserAvatar user={message.user} className="size-8" />
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {message.user.name.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div
                                                                className={`max-w-[70%] rounded-lg p-3 ${
                                                                    isCurrentUser || isConsecutiveMessage
                                                                        ? 'bg-blue-500 text-white'
                                                                        : 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                                                                }`}
                                                            >
                                                                {isGroup(selectedChat) &&
                                                                    !isCurrentUser &&
                                                                    isGroupMessage(message) &&
                                                                    !isConsecutiveMessage && (
                                                                        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                            {message.user.name}
                                                                        </p>
                                                                    )}
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <p className="text-sm">
                                                                            {message.is_encrypted && (
                                                                                <span className="inline-flex items-center mr-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-md text-xs font-medium">
                                                                                    <Lock className="h-3 w-3 mr-1" />
                                                                                    E2E
                                                                                </span>
                                                                            )}
                                                                            {(() => {
                                                                                // For direct messages with encryption
                                                                                if (isDirectMessage(message) && message.is_encrypted) {
                                                                                    // Current user's encrypted messages
                                                                                    if (isCurrentUser) {
                                                                                        // If it's a self-message (messaging yourself), try to show content
                                                                                        const isSelfMessage = selectedChat && selectedChat.id === auth.user?.id;
                                                                                        if (isSelfMessage) {
                                                                                            // For self-messages, we'll try to decrypt if needed
                                                                                            const privateKey = getPrivateKeyFromCookie();
                                                                                            if (privateKey && !message.decrypted_content) {
                                                                                                try {
                                                                                                    return decryptMessage(message.content, privateKey);
                                                                                                } catch (error) {
                                                                                                    console.error('Failed to decrypt self-message in UI:', error);
                                                                                                    // If decryption fails, show content anyway for self-messages
                                                                                                    return message.content;
                                                                                                }
                                                                                            }
                                                                                            // Return decrypted or original content
                                                                                            return message.decrypted_content || message.content;
                                                                                        }
                                                                                        return message.decrypted_content || "[Encrypted Message]";
                                                                                    }
                                                                                    // Other user's encrypted messages
                                                                                    return message.decrypted_content || "[Encrypted message]";
                                                                                }
                                                                                // Regular messages
                                                                                return message.content;
                                                                            })()}
                                                                        </p>
                                                                    {(!isGroup(selectedChat) && isCurrentUser) && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all"
                                                                            onClick={() => handleDeleteMessage(message.id, false)}
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                    {(isGroup(selectedChat) && isGroupMessage(message) && isCurrentUserGroupMessage(message)) && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all"
                                                                            onClick={() => handleDeleteMessage(message.id, true)}
                                                                            >
                                                                                <TrashIcon className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {message.attachments && message.attachments.length > 0 && (
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            {message.attachments.map((attachment) => (
                                                                                <div key={attachment.id} className="group relative">
                                                                                    {attachment.file_type.startsWith('image/') ? (
                                                                                        <img
                                                                                            src={attachment.file_path}
                                                                                            alt={attachment.file_name}
                                                                                            className="max-w-[200px] rounded-lg"
                                                                                        />
                                                                                    ) : attachment.file_type.startsWith('video/') ? (
                                                                                        <video
                                                                                            src={attachment.file_path}
                                                                                            controls
                                                                                            className="max-w-[200px] rounded-lg"
                                                                                        />
                                                                                    ) : attachment.file_type.startsWith('audio/') ? (
                                                                                        <audio
                                                                                            src={attachment.file_path}
                                                                                            controls
                                                                                            className="w-full"
                                                                                        />
                                                                                    ) : attachment.file_type === 'application/pdf' ? (
                                                                                        <a
                                                                                            href={attachment.file_path}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800"
                                                                                        >
                                                                                            <FileText className="h-5 w-5" />
                                                                                            <span className="max-w-[150px] truncate text-sm text-gray-900 dark:text-white">
                                                                                                {attachment.file_name}
                                                                                            </span>
                                                                                        </a>
                                                                                    ) : (
                                                                                        <a
                                                                                            href={attachment.file_path}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800"
                                                                                        >
                                                                                            <File className="h-5 w-5" />
                                                                                            <span className="max-w-[150px] truncate text-sm text-gray-900 dark:text-white">
                                                                                                {attachment.file_name}
                                                                                            </span>
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-1 flex items-center justify-end gap-2 text-xs opacity-70">
                                                                    {message.is_encrypted && (
                                                                        <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                                                                            <Lock className="h-3 w-3" />
                                                                            {isDirectMessage(message) && isCurrentUser ? (
                                                                                <span title="Only you can see the plaintext. The recipient receives the encrypted version.">
                                                                                    Sent encrypted
                                                                                </span>
                                                                            ) : (
                                                                                "Encrypted"
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                                <div ref={messagesEndRef} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Fixed message input at bottom - adjusted to account for sidebar and mobile bottom nav */}
                            <div className="fixed bottom-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-black mb-[70px] md:mb-0 w-full md:w-[calc(100%-320px)]">
                                <form onSubmit={sendMessage} className="flex flex-col">
                                    {selectedFiles.length > 0 && (
                                        <div className="border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-black">
                                            <div className="flex flex-wrap gap-2">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 dark:bg-gray-900">
                                                        <span className="max-w-[150px] truncate text-sm text-gray-900 dark:text-white">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedFiles((files) => files.filter((_, i) => i !== index))}
                                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                            </div>
                        </div>
                    )}
                                    
                                    <div className="flex items-center gap-2 p-4">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder={`Message ${isGroup(selectedChat) ? selectedChat.name : selectedChat?.name}`}
                                                className={`w-full rounded-full border ${
                                                    isEncrypted 
                                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                                                        : 'border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900'
                                                } px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none`}
                                            />
                                            {isEncrypted && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Lock className="h-4 w-4 text-green-500 dark:text-green-400" />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*,audio/*,.pdf"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 5) {
                                                    alert('You can only upload up to 5 files at once');
                                                    return;
                                                }
                                                setSelectedFiles(files);
                                            }}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor="file-upload"
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm cursor-pointer"
                                            >
                                                <PaperClipIcon className="h-5 w-5" />
                                            </label>
                                            
                                            {!hasEncryptionKeys || isGroup(selectedChat) || !selectedChatHasPublicKey ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-10 w-10 rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 transition-all shadow-sm flex items-center justify-center"
                                                        disabled
                                                        title={
                                                            !hasEncryptionKeys
                                                                ? "You need to set up encryption first"
                                                                : isGroup(selectedChat)
                                                                    ? "Encryption is only available for direct messages"
                                                                    : `${selectedChat?.name} hasn't set up encryption yet`
                                                        }
                                                    >
                                                        <Lock
                                                            className="h-5 w-5 text-gray-400 opacity-50 dark:text-gray-500"
                                                        />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={toggleEncryption}
                                                    title={isEncrypted ? "Disable encryption for this message" : "Enable encryption for this message"}
                                                    className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all shadow-sm ${
                                                        isEncrypted
                                                            ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'border-gray-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <Lock className="h-5 w-5" />
                                                </Button>
                                            )}
                                            
                                            <Button
                                                type="submit"
                                                disabled={(!message.trim() && !selectedFiles.length) || isSending}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSending ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <PaperAirplaneIcon className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden h-full flex-1 flex-col items-center justify-center md:flex">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                                    <MessageSquare className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">Your Messages</h3>
                                <p className="text-gray-500 dark:text-gray-400">Select a conversation or start a new one</p>
                                <div className="mt-6 max-w-md space-y-4 px-4">
                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                                                <Lock className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-medium text-blue-800 dark:text-blue-300">End-to-End Encryption Available</h4>
                                                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                                                    Your private messages can be protected with end-to-end encryption. 
                                                    Look for the lock toggle when messaging one-on-one.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    )}
                </div>
            </div>

            {/* Add Members Dialog */}
            <Dialog
                open={isAddMembersOpen}
                onOpenChange={setIsAddMembersOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Members to Group</DialogTitle>
                        <DialogDescription>
                            Select users to add to the group chat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <div className="max-h-60 overflow-y-auto">
                            {allUsers
                                .filter(
                                    (user) =>
                                        !(isGroup(selectedChat) && selectedChat.members.some(
                                            (member) => member.id === user.id
                                        ))
                                )
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {user.avatar ? (
                                                <img
                                                    src={`/storage/${user.avatar}`}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-500">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-gray-500">@{user.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (selectedUsers.includes(user.id)) {
                                                    setSelectedUsers(
                                                        selectedUsers.filter(
                                                            (id) => id !== user.id
                                                        )
                                                    );
                                                } else {
                                                    setSelectedUsers([
                                                        ...selectedUsers,
                                                        user.id,
                                                    ]);
                                                }
                                            }}
                                            className={`p-1 rounded-full ${
                                                selectedUsers.includes(user.id)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsAddMembersOpen(false);
                                setSelectedUsers([]);
                            }}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={addMembersToGroup}
                            disabled={selectedUsers.length === 0}
                        >
                            Add Members
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
