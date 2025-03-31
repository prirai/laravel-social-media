import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import UserAvatar from '@/components/user-avatar';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { ArrowLeftIcon, MagnifyingGlassIcon, PaperAirplaneIcon, PlusIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { File, FileText, Paperclip, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
}

interface GroupMessage {
    id: number;
    content: string;
    user_id: number;
    created_at: string;
    user: MessageUser;
    attachments?: MessageAttachment[];
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
}

type Chat = User | Group;

function isGroup(chat: Chat): chat is Group {
    return 'isGroup' in chat && chat.isGroup === true;
}

interface MessagingProps {
    users: User[];
    groups: Group[];
    allUsers: Array<{
        id: number;
        name: string;
        username: string;
        avatar: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
    }>;
}

const isGroupMessage = (message: Message): message is GroupMessage => {
    return 'user_id' in message && 'user' in message && !('sender_id' in message);
};

const isDirectMessage = (message: Message): message is DirectMessage => {
    return 'sender_id' in message && !('user_id' in message);
};

export default function Messaging({ users: initialUsers = [], groups: initialGroups = [], allUsers = [] }: MessagingProps) {
    const { auth } = usePage<SharedData>().props;
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [expiresIn, setExpiresIn] = useState(24);
    const [showExpirationOptions, setShowExpirationOptions] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [message, setMessage] = useState('');

    const { data, setData, reset } = useForm({
        content: '',
        expires_in: 24,
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (selectedChat) {
            setLoading(true);
            const endpoint = isGroup(selectedChat)
                ? route('groups.messages', selectedChat.id.replace('group_', ''))
                : route('messages.get', selectedChat.id);

            axios
                .get(endpoint)
                .then((response) => {
                    setMessages(response.data.messages);
                    scrollToBottom();
                })
                .finally(() => setLoading(false));
        }
    }, [selectedChat]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChat || (!message.trim() && !selectedFiles.length)) return;

        const formData = new FormData();
        formData.append('content', message);
        selectedFiles.forEach((file) => {
            formData.append('attachments[]', file);
        });

        try {
            const endpoint = isGroup(selectedChat)
                ? route('groups.message', selectedChat.id.replace('group_', ''))
                : route('messages.send', selectedChat.id);

            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessages((prev) => [...prev, response.data.message]);
            setMessage('');
            setSelectedFiles([]);

            if (isGroup(selectedChat)) {
                setGroups((currentGroups) =>
                    currentGroups.map((group) =>
                        group.id === selectedChat.id ? { ...group, lastMessage: message, lastMessageTime: 'Just now' } : group,
                    ),
                );
            } else {
                setUsers((currentUsers) =>
                    currentUsers.map((user) =>
                        user.id === selectedChat.id ? { ...user, lastMessage: message, lastMessageTime: 'Just now' } : user,
                    ),
                );
            }

            reset('content');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
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

            const response = await axios.post(route('groups.create'), formData);
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
            };

            setGroups((currentGroups) => [group, ...currentGroups]);

            setIsNewGroupOpen(false);
            setSelectedUsers([]);
            setGroupName('');
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const filteredUsers = allUsers.filter(
        (user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const startNewConversation = (user: {
        id: number;
        name: string;
        username: string;
        avatar: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified' | undefined;
    }) => {
        const newUser: User = {
            ...user,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0,
        };
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

    const formatExpirationTime = (expiresAt: string) => {
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        const diffInHours = Math.round((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (diffInHours <= 0) return 'Expired';
        if (diffInHours < 24) return `Expires in ${diffInHours}h`;
        return `Expires in ${Math.round(diffInHours / 24)}d`;
    };

    const handleDeleteMessage = (messageId: number) => {
        if (!selectedChat) return;

        // Optimistically update the UI
        setMessages((prevMessages) => prevMessages.filter((message) => message.id !== messageId));

        router.delete(route('messages.destroy', messageId), {
            preserveScroll: true,
            onError: () => {
                // Revert the optimistic update on error
                setMessages((prevMessages) => [...prevMessages]);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} fullWidth={true}>
            <Head title="Messages" />
            <div className="flex h-[calc(100vh-4rem)] flex-1 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div
                    className={`${isMobileView && selectedChat ? 'hidden' : 'flex'} fixed inset-y-0 left-0 z-20 w-full flex-col border-r border-gray-200 bg-white md:static md:w-80 dark:border-gray-800 dark:bg-black`}
                >
                    <div className="flex flex-col">
                        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search messages..."
                                        className="h-9 pl-9 text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                            <PlusIcon className="h-5 w-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>New Message</DialogTitle>
                                        </DialogHeader>
                                        <div className="mt-4 space-y-4">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search users..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                                                {filteredUsers.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => startNewConversation(user)}
                                                        className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
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
                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                            <UsersIcon className="h-5 w-5" />
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
                                                            className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-blue-50 dark:hover:bg-blue-950"
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
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-1 p-2">
                            {[...users, ...groups]
                                .sort((a, b) => {
                                    if ('isCurrentUser' in a && a.isCurrentUser) return -1;
                                    if ('isCurrentUser' in b && b.isCurrentUser) return 1;

                                    if (!a.lastMessageTime) return 1;
                                    if (!b.lastMessageTime) return -1;
                                    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
                                })
                                .map((chat) => (
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
                                            {isGroup(chat) && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {chat.members.map((m: { name: string }) => m.name).join(', ')}
                                                </p>
                                            )}
                                            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                {chat.lastMessage || (isGroup(chat) 
                                                    ? `Start chatting in ${chat.name}` 
                                                    : `Start chatting with ${chat.name}`)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    {selectedChat ? (
                        <>
                            <div className="z-10 flex justify-center p-4">
                                <div className="flex w-full max-w-3xl items-center justify-between rounded-full border border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
                                        {/* Optional: Add action buttons here */}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-4 h-[calc(100vh-180px)] flex-1 overflow-y-auto">
                                    <div className="flex min-h-full flex-col justify-end p-4 pb-[180px]">
                                        {loading ? (
                                            <div className="flex h-full items-center justify-center">
                                                <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {!isGroup(selectedChat) && (
                                                    <div className="flex justify-center">
                                                        <div className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                                                            Messages will expire in {expiresIn} {expiresIn === 1 ? 'hour' : 'hours'}
                                                        </div>
                                                    </div>
                                                )}
                                                {messages.map((message, index) => {
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
                                                                        <p className="text-sm">{message.content}</p>
                                                                        {!isGroup(selectedChat) && isCurrentUser && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white"
                                                                                onClick={() => handleDeleteMessage(message.id)}
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
                                                                <div className="mt-1 flex items-center justify-end text-xs opacity-70">
                                                                    <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="hidden h-full flex-1 flex-col items-center justify-center md:flex">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">Your messages</h3>
                                <p className="text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
                            </div>
                            <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    )}
                </div>

                <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-gray-200 bg-white md:left-[320px] dark:border-gray-800 dark:bg-black">
                    {selectedChat ? (
                        <>
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
                                            className="w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900"
                                        />
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
                                    <label
                                        htmlFor="file-upload"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </label>
                                    <Button
                                        type="submit"
                                        disabled={!message.trim() && !selectedFiles.length}
                                        className="flex h-10 items-center gap-2 rounded-full bg-blue-500 px-4 text-white hover:bg-blue-600"
                                    >
                                        <span className="text-sm">Send</span>
                                        <PaperAirplaneIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex gap-2 p-4 md:hidden">
                            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                                <DialogTrigger asChild>
                                    <Button className="flex-1" variant="outline">
                                        <PlusIcon className="mr-2 h-5 w-5" />
                                        New Message
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>New Message</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4 space-y-4">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                                            {filteredUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => startNewConversation(user)}
                                                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
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
                                    <Button className="flex-1" variant="outline">
                                        <UsersIcon className="mr-2 h-5 w-5" />
                                        New Group
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
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-blue-50 dark:hover:bg-blue-950"
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
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
