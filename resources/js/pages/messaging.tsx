import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import UserAvatar from '@/components/user-avatar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Messages',
        href: '/messages',
    },
];

// Mock data for demonstration
const users = [
    {
        id: 1,
        name: 'John Doe',
        username: 'johndoe',
        avatar: null,
        lastMessage: 'Hey, how are you?',
        lastMessageTime: '2:30 PM',
    },
    {
        id: 2,
        name: 'Jane Smith',
        username: 'janesmith',
        avatar: '/storage/avatars/jane.jpg',
        lastMessage: 'See you tomorrow!',
        lastMessageTime: '11:20 AM',
    },
    {
        id: 3,
        name: 'Mike Johnson',
        username: 'mikej',
        avatar: null,
        lastMessage: 'Thanks for your help',
        lastMessageTime: 'Yesterday',
    },
];

export default function Messaging() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />
            <div className="flex h-[calc(100vh-12rem)] flex-1 gap-4 rounded-xl border">
                {/* Users List - Left Sidebar */}
                <div className="w-80 border-r">
                    <div className="p-4">
                        <h2 className="mb-4 text-lg font-semibold">Messages</h2>
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <UserAvatar user={user} className="size-12" />
                                    
                                    {/* User Info */}
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{user.name}</p>
                                            <span className="text-xs text-gray-500">{user.lastMessageTime}</span>
                                        </div>
                                        <p className="truncate text-sm text-gray-500">
                                            {user.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Window - Right Side */}
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center text-gray-500">
                        <p className="text-lg">Select a conversation to start messaging</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 