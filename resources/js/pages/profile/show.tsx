import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem, SharedData } from '@/types';
import { FlagIcon, EnvelopeIcon, HeartIcon, UserGroupIcon, PhotoIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import PostItem from '@/components/post-item';

interface Post {
    id: number;
    content: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    attachments: Array<{
        id: number;
        file_path: string;
        file_type: string;
    }>;
    user: {
        name: string;
        username: string;
        avatar: string;
        verification_status?: 'unverified' | 'pending' | 'verified';
    };
    likes: Array<{
        id: number;
        user_id: number;
        post_id: number;
    }>;
    comments: Array<{
        id: number;
        user_id: number;
        post_id: number;
        content: string;
        user: {
            name: string;
            username?: string;
            avatar?: string;
            verification_status?: 'unverified' | 'pending' | 'verified';
        };
    }>;
}

interface UserProfile {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    verification_status?: 'unverified' | 'pending' | 'verified';
    created_at?: string;
    posts: Post[];
    friend_request?: {
        id: number;
        status: 'pending' | 'accepted' | 'rejected';
        sender_id: number;
        receiver_id: number;
    };
    is_friend?: boolean;
    friends?: Array<{
        id: number;
        name: string;
        username: string;
        avatar: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified';
    }>;
}

export default function ShowProfile({ user, isOwnProfile = false }: { user: UserProfile, isOwnProfile: boolean }) {
    const [isReportOpen, setIsReportOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        reason: '',
    });

    const { props } = usePage<SharedData>();
    const authUserId = props.auth?.user?.id;

    const handleReport = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.report', user.username), {
            onSuccess: () => {
                reset();
                setIsReportOpen(false);
            },
        });
    };

    const handleFriendRequest = () => {
        if (user.friend_request) {
            // Cancel friend request
            router.delete(route('friend-requests.cancel', user.friend_request.id), {
                onSuccess: (response) => {
                    // Check if the response contains updated user data
                    const updatedUser = response?.props?.user;
                    if (updatedUser) {
                        // Update the user object
                        Object.assign(user, updatedUser);
                    } else {
                        // Fallback: just remove the friend request
                        user.friend_request = undefined;
                    }
                },
            });
        } else {
            // Send friend request
            post(route('friend-requests.send', user.username), {
                onSuccess: (response) => {
                    // Check if the response contains updated user data
                    const updatedUser = response?.props?.user;
                    if (updatedUser) {
                        // Update the user object
                        Object.assign(user, updatedUser);
                    }
                },
            });
        }
    };

    const handleAcceptRequest = () => {
        post(route('friend-requests.accept', user.friend_request?.id), {
            onSuccess: (response) => {
                // Check if the response contains updated user data
                const updatedUser = response?.props?.user;
                if (updatedUser) {
                    // Update the user object
                    Object.assign(user, updatedUser);
                } else {
                    // Fallback: update the status
                    if (user.friend_request) {
                        user.friend_request.status = 'accepted';
                    }
                    user.is_friend = true;
                }
            },
        });
    };

    const handleRejectRequest = () => {
        post(route('friend-requests.reject', user.friend_request?.id), {
            onSuccess: (response) => {
                // Check if the response contains updated user data
                const updatedUser = response?.props?.user;
                if (updatedUser) {
                    // Update the user object
                    Object.assign(user, updatedUser);
                } else {
                    // Fallback: update the status
                    if (user.friend_request) {
                        user.friend_request.status = 'rejected';
                    }
                }
            },
        });
    };

    const handleLike = (postId: number) => {
        post(route('posts.like', { post: postId }));
    };

    const handleDeletePost = (postId: number) => {
        if (confirm('Are you sure you want to delete this post?')) {
            router.delete(route('posts.destroy', postId), {
                onSuccess: () => {
                    // Success notification could be added here
                },
                onError: (errors) => {
                    console.error('Error deleting post:', errors);
                },
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Profile',
            href: route('profile.show', user.username),
        },
    ];

    const [activeTab, setActiveTab] = useState('posts');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name}'s Profile`} />

            <div className="mx-auto max-w-4xl px-4 py-8 md:px-0">
                {/* Profile Header - Enhanced */}
                <div className="relative mb-8 overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 dark:to-black/80"></div>

                    <div className="relative p-6 md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
                            <UserAvatar
                                user={user}
                                className="size-24 md:size-32 ring-4 ring-white dark:ring-gray-900 shadow-lg"
                                linkable={false}
                            />

                            <div className="flex-1">
                                <h1 className="text-2xl font-bold md:text-3xl">{user.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                                    {user.verification_status && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            user.verification_status === 'verified'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : user.verification_status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                            {user.verification_status}
                                        </span>
                                    )}
                        </div>

                                <div className="mt-4 flex flex-wrap gap-4">
                        {!isOwnProfile && (
                                        <>
                                <Button
                                                variant="default"
                                                className="gap-2"
                                    onClick={() => router.visit(route('messages.index'))}
                                >
                                                <EnvelopeIcon className="h-5 w-5" />
                                    Message
                                </Button>

                                {user.is_friend ? (
                                    <Button
                                        variant="outline"
                                                    className="bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 gap-2"
                                        disabled
                                    >
                                                    <HeartIconSolid className="h-5 w-5" />
                                        Friends
                                    </Button>
                                            ) : user.friend_request ? (
                                                user.friend_request.sender_id === authUserId ? (
                                        <Button
                                            variant="outline"
                                                        className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 gap-2"
                                            onClick={handleFriendRequest}
                                            disabled={processing}
                                        >
                                                        <HeartIcon className="h-5 w-5" />
                                            Cancel Request
                                        </Button>
                                    ) : (
                                                    <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                            className="bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 gap-2"
                                                onClick={handleAcceptRequest}
                                                disabled={processing}
                                            >
                                                            <HeartIcon className="h-5 w-5" />
                                                Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                            className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 gap-2"
                                                onClick={handleRejectRequest}
                                                disabled={processing}
                                            >
                                                            <HeartIcon className="h-5 w-5" />
                                                Reject
                                            </Button>
                                                    </div>
                                    )
                                ) : (
                                    <Button
                                        variant="outline"
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 gap-2"
                                        onClick={handleFriendRequest}
                                        disabled={processing}
                                    >
                                                    <HeartIcon className="h-5 w-5" />
                                        Add Friend
                                    </Button>
                                )}

                                <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                                    <DialogTrigger asChild>
                                                    <Button variant="outline" className="text-red-500 hover:text-red-600 gap-2">
                                                        <FlagIcon className="h-5 w-5" />
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
                                        </>
                        )}
                                </div>
                    </div>
                </div>

                        {/* Profile Stats */}
                        <div className="mt-6 flex flex-wrap gap-6 border-t border-gray-200 dark:border-gray-800 pt-4">
                            <div className="flex items-center gap-2">
                                <PhotoIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium">{user.posts?.length || 0} Posts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserGroupIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium">{user.friends?.length || 0} Friends</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium">
                                    {user.created_at
                                        ? `Joined ${new Date(user.created_at).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}`
                                        : 'Joined recently'}
                                </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                {/* Tabs for Posts and Friends */}
                <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                        <TabsTrigger value="posts" className="flex-1 rounded-lg">
                            <PhotoIcon className="h-4 w-4 mr-2" />
                            Posts
                        </TabsTrigger>
                        <TabsTrigger value="friends" className="flex-1 rounded-lg">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            Friends
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-0">
                        <h2 className="sr-only">Posts</h2>
                        <div className="space-y-6">
                            {user.posts && user.posts.length > 0 ? (
                                user.posts.map((post) => (
                                    <PostItem
                                        key={post.id}
                                        post={post}
                                        onLike={handleLike}
                                        onComment={(post) => {
                                            setSelectedPost(post);
                                            setCommentOpen(true);
                                        }}
                                        onDelete={isOwnProfile ? handleDeletePost : undefined}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center dark:bg-black">
                                    <PhotoIcon className="h-16 w-16 text-gray-300 dark:text-gray-700" />
                                    <p className="mt-4 text-lg font-medium">No posts yet</p>
                                    <p className="mt-2 text-sm text-gray-500">This user hasn't shared any posts.</p>
                                            </div>
                                        )}
                                    </div>
                    </TabsContent>

                    <TabsContent value="friends" className="mt-0">
                        <h2 className="sr-only">Friends</h2>
                        {user.friends && user.friends.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {user.friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-black transition-all hover:shadow-md"
                                        onClick={() => router.visit(route('profile.show', friend.username))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <UserAvatar user={friend} className="size-14" />
                                        <div>
                                            <p className="font-medium">{friend.name}</p>
                                            <p className="text-sm text-gray-500">@{friend.username}</p>
                                            {friend.verification_status && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                                                    friend.verification_status === 'verified'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : friend.verification_status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                    {friend.verification_status}
                                                </span>
                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center dark:bg-black">
                                <UserGroupIcon className="h-16 w-16 text-gray-300 dark:text-gray-700" />
                                <p className="mt-4 text-lg font-medium">No friends yet</p>
                                <p className="mt-2 text-sm text-gray-500">This user hasn't connected with anyone yet.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
