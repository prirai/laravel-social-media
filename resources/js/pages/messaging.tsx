import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem } from '@/types';
import { MagnifyingGlassIcon, PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
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
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
}

interface Message {
    id: number;
    content: string;
    sender_id: number;
    sender: {
        id: number;
        name: string;
        avatar: string | null;
    };
    created_at: string;
}

interface AllUser {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
}

export default function Messaging({ users: initialUsers = [], allUsers = [] }: { users: User[], allUsers: AllUser[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, reset } = useForm({
        content: '',
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (selectedUser) {
            setLoading(true);
            axios.get(route('messages.get', selectedUser.id))
                .then(response => {
                    setMessages(response.data.messages);
                    scrollToBottom();
                })
                .finally(() => setLoading(false));
        }
    }, [selectedUser]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !data.content.trim()) return;

        try {
            const response = await axios.post(route('messages.send', selectedUser.id), data);
            const newMessage = response.data.message;
            setMessages([...messages, newMessage]);

            setUsers(currentUsers => {
                const now = new Date().toISOString();
                const existingUserIndex = currentUsers.findIndex(u => u.id === selectedUser.id);
                const updatedUser: User = {
                    ...selectedUser,
                    lastMessage: data.content,
                    lastMessageTime: 'Just now',
                    unreadCount: 0,
                };

                if (existingUserIndex !== -1) {
                    const newUsers = [...currentUsers];
                    newUsers[existingUserIndex] = updatedUser;
                    return newUsers;
                } else {
                    return [updatedUser, ...currentUsers];
                }
            });

            reset('content');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const startNewConversation = (user: AllUser) => {
        const existingUser = users.find(u => u.id === user.id);
        const newUser: User = existingUser || {
            ...user,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0,
        };
        setSelectedUser(newUser);
        setIsNewMessageOpen(false);
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />
            <div className="flex h-[calc(100vh-12rem)] flex-1 gap-4 overflow-hidden rounded-xl border">
                {/* Users List */}
                <div className="w-80 border-r">
                    <div className="h-full overflow-y-auto p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Messages</h2>
                            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="flex items-center gap-2">
                                        <PlusIcon className="h-5 w-5" />
                                        New Message
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>New Message</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4 space-y-4">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
                        </div>
                        
                        <div className="space-y-2">
                            {sortedUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 
                                        ${selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                                >
                                    <div className="relative">
                                        <UserAvatar user={user} className="size-12" />
                                        {user.unreadCount > 0 && (
                                            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                {user.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium">{user.name}</p>
                                        <p className="truncate text-sm text-gray-500">
                                            {user.lastMessage || `Start chatting with ${user.name}`}
                                        </p>
                                        {user.lastMessageTime && (
                                            <p className="text-xs text-gray-400">{user.lastMessageTime}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className="flex flex-1 flex-col">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="border-b p-4">
                                <div className="flex items-center gap-3">
                                    <UserAvatar user={selectedUser} className="size-10" />
                                    <div>
                                        <p className="font-medium">{selectedUser.name}</p>
                                        <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="text-gray-500">Loading messages...</div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-2 ${
                                                    message.sender_id === selectedUser.id ? 'justify-start' : 'justify-end'
                                                }`}
                                            >
                                                {message.sender_id === selectedUser.id && (
                                                    <UserAvatar user={message.sender} className="size-8" />
                                                )}
                                                <div
                                                    className={`rounded-lg px-4 py-2 ${
                                                        message.sender_id === selectedUser.id
                                                            ? 'bg-gray-100 dark:bg-gray-800'
                                                            : 'bg-blue-500 text-white'
                                                    }`}
                                                >
                                                    <p>{message.content}</p>
                                                    <p className="text-xs opacity-70">
                                                        {new Date(message.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <form onSubmit={sendMessage} className="border-t p-4">
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={!data.content.trim()}>
                                        <PaperAirplaneIcon className="size-5" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="text-center text-gray-500">
                                <p className="text-lg">Select a conversation to start messaging</p>
                            </div>
                            <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 