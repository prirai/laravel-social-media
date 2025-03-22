import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { MagnifyingGlassIcon, PaperAirplaneIcon, PlusIcon, UsersIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
    created_at: string;
}

interface AllUser {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
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
    }>;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
}

interface GroupMessage extends Message {
    user: {
        id: number;
        name: string;
        username: string;
        avatar: string | null;
    };
}

export default function Messaging({ users: initialUsers = [], groups: initialGroups = [], allUsers = [] }) {
    const { auth } = usePage<SharedData>().props;
    const [users, setUsers] = useState(initialUsers);
    const [groups, setGroups] = useState(initialGroups);
    const [selectedChat, setSelectedChat] = useState<(User | Group) | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

    const { data, setData, reset } = useForm({
        content: '',
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (selectedChat) {
            setLoading(true);
            const endpoint = selectedChat.isGroup 
                ? route('groups.messages', selectedChat.id.replace('group_', ''))
                : route('messages.get', selectedChat.id);

            axios.get(endpoint)
                .then(response => {
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
        if (!selectedChat || !data.content.trim()) return;

        try {
            let response;
            if (selectedChat.isGroup) {
                response = await axios.post(
                    route('groups.message', selectedChat.id.replace('group_', '')), 
                    data
                );
            } else {
                response = await axios.post(route('messages.send', selectedChat.id), data);
            }
            
            const newMessage = response.data.message;
            setMessages([...messages, newMessage]);

            if (selectedChat.isGroup) {
                setGroups(currentGroups => {
                    return currentGroups.map(group => {
                        if (group.id === selectedChat.id) {
                            return {
                                ...group,
                                lastMessage: data.content,
                                lastMessageTime: 'Just now'
                            };
                        }
                        return group;
                    });
                });
            } else {
                setUsers(currentUsers => {
                    const existingUserIndex = currentUsers.findIndex(u => u.id === selectedChat.id);
                    const updatedUser = {
                        ...selectedChat,
                        lastMessage: data.content,
                        lastMessageTime: 'Just now'
                    };

                    if (existingUserIndex !== -1) {
                        const newUsers = [...currentUsers];
                        newUsers[existingUserIndex] = updatedUser;
                        return newUsers;
                    }
                    return [updatedUser, ...currentUsers];
                });
            }

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
        setSelectedChat(newUser);
        setIsNewMessageOpen(false);
    };

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUsers.length < 2 || !groupName.trim()) return;

        try {
            const formData = new FormData();
            formData.append('name', groupName);
            selectedUsers.forEach(userId => {
                formData.append('users[]', userId.toString());
            });

            const response = await axios.post(route('groups.create'), formData);
            const newGroup = response.data.group;

            setGroups(currentGroups => [
                {
                    id: `group_${newGroup.id}`,
                    name: newGroup.name,
                    avatar: newGroup.avatar,
                    isGroup: true,
                    members: newGroup.users,
                    lastMessage: null,
                    lastMessageTime: null,
                    unreadCount: 0,
                },
                ...currentGroups
            ]);

            setIsNewGroupOpen(false);
            setSelectedUsers([]);
            setGroupName('');
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const ChatHeader = () => {
        if (!selectedChat) return null;

        return (
            <div className="border-b p-4">
                <div className="flex items-center gap-3">
                    {selectedChat.isGroup ? (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <UserAvatar
                                    user={{ name: selectedChat.name, avatar: selectedChat.avatar }}
                                    className="size-10"
                                />
                                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                    {selectedChat.members.length}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium">{selectedChat.name}</p>
                                <p className="text-sm text-gray-500">
                                    {selectedChat.members.map(m => m.name).join(', ')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <UserAvatar user={selectedChat} className="size-10" />
                            <div>
                                <p className="font-medium">{selectedChat.name}</p>
                                <p className="text-sm text-gray-500">@{selectedChat.username}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const isCurrentUserMessage = (message: Message | GroupMessage) => {
        if (!auth.user) return false;
        
        if ('user' in message) {
            return message.user.id === auth.user.id;
        }
        return message.sender_id === auth.user.id;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />
            <div className="flex h-[calc(100vh-12rem)] flex-1 overflow-hidden rounded-xl border">
                <div 
                    className={`${
                        isMobileView && selectedChat ? 'hidden' : 'flex'
                    } w-full flex-col border-r md:w-80 md:flex`}
                >
                    <div className="border-b p-4">
                        <h2 className="text-lg font-semibold">Messages</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-2">
                            {[...users, ...groups]
                                .sort((a, b) => {
                                    if (!a.lastMessageTime) return 1;
                                    if (!b.lastMessageTime) return -1;
                                    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
                                })
                                .map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 
                                            ${selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                                    >
                                        {chat.isGroup ? (
                                            <div className="relative">
                                                <UserAvatar
                                                    user={{ name: chat.name, avatar: chat.avatar }}
                                                    className="size-12"
                                                />
                                                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                    {chat.members.length}
                                                </span>
                                            </div>
                                        ) : (
                                            <UserAvatar user={chat} className="size-12" />
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-medium">{chat.name}</p>
                                            {chat.isGroup && (
                                                <p className="text-xs text-gray-500">
                                                    {chat.members.map(m => m.name).join(', ')}
                                                </p>
                                            )}
                                            <p className="truncate text-sm text-gray-500">
                                                {chat.lastMessage || `Start chatting in ${chat.name}`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>

                    <div className="border-t p-4">
                        <div className="flex gap-2">
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
                                                                setSelectedUsers(current =>
                                                                    checked
                                                                        ? [...current, user.id]
                                                                        : current.filter(id => id !== user.id)
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
                                            <Button
                                                type="submit"
                                                disabled={selectedUsers.length < 2 || !groupName.trim()}
                                            >
                                                Create Group
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <div 
                    className={`${
                        isMobileView && !selectedChat ? 'hidden' : 'flex'
                    } flex-1 flex-col md:flex`}
                >
                    {selectedChat ? (
                        <>
                            <div className="border-b p-4">
                                <div className="flex items-center gap-3">
                                    {isMobileView && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedChat(null)}
                                            className="mr-2"
                                        >
                                            <ArrowLeftIcon className="h-5 w-5" />
                                        </Button>
                                    )}
                                    {selectedChat.isGroup ? (
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <UserAvatar
                                                    user={{ name: selectedChat.name, avatar: selectedChat.avatar }}
                                                    className="size-10"
                                                />
                                                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                    {selectedChat.members.length}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{selectedChat.name}</p>
                                                <p className="text-sm text-gray-500 line-clamp-1">
                                                    {selectedChat.members.map(m => m.name).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <UserAvatar user={selectedChat} className="size-10" />
                                            <div>
                                                <p className="font-medium">{selectedChat.name}</p>
                                                <p className="text-sm text-gray-500">@{selectedChat.username}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="text-gray-500">Loading messages...</div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => {
                                            const isCurrentUser = isCurrentUserMessage(message);
                                            const showAvatar = selectedChat?.isGroup && !isCurrentUser;

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex gap-2 ${
                                                        isCurrentUser ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    {showAvatar && 'user' in message && (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <UserAvatar user={message.user} className="size-8" />
                                                            <span className="text-xs text-gray-500">
                                                                {message.user.name.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                                            isCurrentUser
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-800'
                                                        }`}
                                                    >
                                                        {selectedChat?.isGroup && !isCurrentUser && 'user' in message && (
                                                            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                {message.user.name}
                                                            </p>
                                                        )}
                                                        <p>{message.content}</p>
                                                        <p className="mt-1 text-xs opacity-70">
                                                            {new Date(message.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

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
                        <div className="hidden flex-1 items-center justify-center md:flex">
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