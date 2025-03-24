import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem, SharedData } from '@/types';
import { FlagIcon, EnvelopeIcon, ChatBubbleLeftIcon, DocumentIcon, HeartIcon } from '@heroicons/react/24/outline';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

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
        };
    }>;
}

interface UserProfile {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    posts: Post[];
    friend_request?: {
        id: number;
        status: 'pending' | 'accepted' | 'rejected';
        sender_id: number;
        receiver_id: number;
    };
    is_friend?: boolean;
}

export default function ShowProfile({ user, isOwnProfile = false }: { user: UserProfile, isOwnProfile: boolean }) {
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [friendRequestStatus, setFriendRequestStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(
        user.friend_request?.status || null
    );

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
        if (friendRequestStatus === 'pending') {
            // Cancel friend request
            post(route('friend-requests.cancel', user.friend_request?.id), {
                method: 'delete',
                onSuccess: () => {
                    setFriendRequestStatus(null);
                },
            });
        } else {
            // Send friend request
            post(route('friend-requests.send', user.username), {
                onSuccess: () => {
                    setFriendRequestStatus('pending');
                },
            });
        }
    };

    const handleAcceptRequest = () => {
        post(route('friend-requests.accept', user.friend_request?.id), {
            onSuccess: () => {
                setFriendRequestStatus('accepted');
            },
        });
    };

    const handleRejectRequest = () => {
        post(route('friend-requests.reject', user.friend_request?.id), {
            onSuccess: () => {
                setFriendRequestStatus('rejected');
            },
        });
    };

    const handleLike = (postId: number) => {
        post(route('posts.like', { post: postId }));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Profile',
            href: route('profile.show', user.username),
        },
    ];

    // Add these debug logs
    console.log('Full user data:', user);
    console.log('User posts:', user.posts);
    if (user.posts.length > 0) {
        console.log('First post details:', user.posts[0]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name}'s Profile`} />

            <div className="mx-auto max-w-3xl px-4 py-8 md:px-0">
                {/* Profile Header */}
                <div className="mb-8 rounded-xl border p-6">
                    <div className="flex flex-col gap-4">
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
                                    onClick={() => router.visit(route('messages.index'))}
                                >
                                    <EnvelopeIcon className="mr-2 h-5 w-5" />
                                    Message
                                </Button>

                                {user.is_friend ? (
                                    <Button
                                        variant="outline"
                                        className="bg-green-50 text-green-600 hover:bg-green-100"
                                        disabled
                                    >
                                        <HeartIcon className="mr-2 h-5 w-5" />
                                        Friends
                                    </Button>
                                ) : friendRequestStatus === 'pending' ? (
                                    user.friend_request?.sender_id === authUserId ? (
                                        // Sender sees Cancel Request button
                                        <Button
                                            variant="outline"
                                            className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                            onClick={handleFriendRequest}
                                            disabled={processing}
                                        >
                                            <HeartIcon className="mr-2 h-5 w-5" />
                                            Cancel Request
                                        </Button>
                                    ) : (
                                        // Receiver sees Accept/Reject buttons
                                        <>
                                            <Button
                                                variant="outline"
                                                className="bg-green-50 text-green-600 hover:bg-green-100"
                                                onClick={handleAcceptRequest}
                                                disabled={processing}
                                            >
                                                <HeartIcon className="mr-2 h-5 w-5" />
                                                Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-red-50 text-red-600 hover:bg-red-100"
                                                onClick={handleRejectRequest}
                                                disabled={processing}
                                            >
                                                <HeartIcon className="mr-2 h-5 w-5" />
                                                Reject
                                            </Button>
                                        </>
                                    )
                                ) : (
                                    // No request exists, show Add Friend button
                                    <Button
                                        variant="outline"
                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        onClick={handleFriendRequest}
                                        disabled={processing}
                                    >
                                        <HeartIcon className="mr-2 h-5 w-5" />
                                        Add Friend
                                    </Button>
                                )}

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
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Posts</h2>
                    <div className="space-y-6">
                        {user.posts?.length > 0 ? (
                            user.posts.map((post) => (
                                <div key={post.id} className="rounded-xl border shadow-sm">
                                    <div className="border-b p-4">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={post.user} className="size-10" />
                                            <div className="flex-1">
                                                <p className="font-medium">{post.user.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>@{post.user.username}</span>
                                                    <span>•</span>
                                                    <span>{new Date(post.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-4">
                                        <div className="whitespace-pre-wrap text-base">{post.content}</div>

                                        {post.attachments?.length > 0 && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {post.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="overflow-hidden rounded-lg">
                                                        {attachment.file_type.includes('image') ? (
                                                            <div className="flex justify-center">
                                                                <img
                                                                    src={attachment.file_path}
                                                                    alt="Attachment"
                                                                    className="w-full rounded-lg md:max-w-[600px] md:object-contain"
                                                                    style={{
                                                                        maxHeight: '80vh',
                                                                        width: '100%',
                                                                        height: 'auto'
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <a
                                                                href={attachment.file_path}
                                                                target="_blank"
                                                                className="mx-auto flex w-full max-w-[600px] items-center justify-center rounded-lg bg-gray-100 p-6 dark:bg-gray-800"
                                                            >
                                                                <DocumentIcon className="h-10 w-10" />
                                                                <span className="ml-2">View PDF</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t px-4 py-3">
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={() => handleLike(post.id)}
                                                className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                                            >
                                                {post.likes?.some((like) => like.user_id === authUserId) ? (
                                                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                                                ) : (
                                                    <HeartIcon className="h-6 w-6" />
                                                )}
                                                <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                                            </button>

                                            <div className="flex items-center gap-2 text-gray-500">
                                                <ChatBubbleLeftIcon className="h-6 w-6" />
                                                <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {post.comments?.length > 0 && (
                                        <div className="border-t bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
                                            <div className="space-y-3">
                                                {post.comments.map((comment) => (
                                                    <div key={comment.id} className="flex items-start gap-3">
                                                        <UserAvatar user={comment.user} className="size-8" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{comment.user.name}</span>
                                                                <span className="text-sm text-gray-500">@{comment.user.username}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No posts yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
