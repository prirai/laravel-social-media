import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem } from '@/types';
import { FlagIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface UserProfile {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    posts: Array<Post>; // Use your existing Post interface
}

export default function ShowProfile({ user, isOwnProfile = false }: { user: UserProfile, isOwnProfile: boolean }) {
    const [isReportOpen, setIsReportOpen] = useState(false);
    
    const { data, setData, post, processing, reset } = useForm({
        reason: '',
    });

    const handleReport = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.report', user.username), {
            onSuccess: () => {
                reset();
                setIsReportOpen(false);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Profile',
            href: route('profile.show', user.username),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name}'s Profile`} />
            
            <div className="mx-auto max-w-3xl px-4 py-8 md:px-0">
                {/* Profile Header */}
                <div className="mb-8 rounded-xl border p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <UserAvatar user={user} className="size-20" linkable={false} />
                            <div>
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <p className="text-gray-500">@{user.username}</p>
                            </div>
                        </div>
                        
                        {!isOwnProfile && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = route('messages.new', user.username)}
                                >
                                    <EnvelopeIcon className="mr-2 h-5 w-5" />
                                    Message
                                </Button>

                                <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="text-red-500 hover:text-red-600">
                                            <FlagIcon className="mr-2 h-5 w-5" />
                                            Report
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Report User</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleReport} className="space-y-4">
                                            <div>
                                                <Textarea
                                                    value={data.reason}
                                                    onChange={(e) => setData('reason', e.target.value)}
                                                    placeholder="Why are you reporting this user?"
                                                    className="min-h-[100px]"
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsReportOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="bg-red-500 hover:bg-red-600"
                                                >
                                                    Submit Report
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                </div>

                {/* User's Posts */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Posts</h2>
                    {user.posts.length > 0 ? (
                        user.posts.map((post) => (
                            // Reuse your existing post component structure here
                            <div key={post.id} className="rounded-xl border shadow-sm">
                                {/* ... Post content (reuse from dashboard.tsx) ... */}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No posts yet</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 