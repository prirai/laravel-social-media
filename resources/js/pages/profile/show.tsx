import PostItem from '@/components/post-item';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Added DialogDescription
import { Input } from '@/components/ui/input'; // Import Input
import { Label } from '@/components/ui/label'; // Import Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/user-avatar';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, SharedData } from '@/types';
import { CalendarIcon, EnvelopeIcon, FlagIcon, HeartIcon, PaperClipIcon, PhotoIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline'; // Added TrashIcon, PaperClipIcon
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios'; // Added axios
import React, { useEffect, useState } from 'react'; // Added React, useEffect

// Interface definitions remain the same...
interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        username?: string; // Optional based on context
        avatar?: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified';
    };
}

interface Post {
    id: number;
    content: string;
    user_id: number; // Added from diagnostic
    created_at: string;
    updated_at: string; // Added from diagnostic
    attachments: Array<{
        id: number;
        file_path: string;
        file_type: string;
    }>;
    user: {
        // Ensure this user type is consistent or handle potential differences
        id: number; // Added based on diagnostic in PostItem usage
        name: string;
        username: string;
        avatar: string;
        verification_status?: 'unverified' | 'pending' | 'verified';
        is_friend?: boolean; // Added based on diagnostic in PostItem usage
    };
    likes: Array<{
        id: number;
        user_id: number;
        post_id: number;
    }>;
    comments: Comment[];
}

interface UserProfile {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    verification_status?: 'unverified' | 'pending' | 'verified';
    created_at?: string;
    posts: Post[]; // Use the Post interface defined above
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

// Add reportCategories to component props
export default function ShowProfile({
    user,
    isOwnProfile = false,
    reportCategories, // <-- Add this prop
}: {
    user: UserProfile;
    isOwnProfile: boolean;
    reportCategories: Record<string, string>; // <-- Define type for categories
}) {
    const [isReportOpen, setIsReportOpen] = useState(false);
    const {
        data: reportData,
        setData: setReportData,
        post: postReport,
        processing: processingReport,
        errors: reportErrors, // <-- Capture report errors
        reset: resetReport,
        progress: reportProgress, // <-- Optional: track upload progress
    } = useForm<{ reason: string; category: string; attachment: File | null }>({
        // <-- Update useForm type
        reason: '',
        category: '', // Initialize category
        attachment: null, // Initialize attachment
    });

    // ... other state variables (commentOpen, selectedPost, etc.) ...
    const [profilePosts, setProfilePosts] = useState<Post[]>(user.posts || []);
    const [commentOpen, setCommentOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [commentErrors, setCommentErrors] = useState<{ [key: string]: string }>({});
    const { data: commentData, setData: setCommentData, processing: commentProcessing, reset: resetComment } = useForm({ content: '' });

    const { props } = usePage<SharedData & { reportCategories: Record<string, string> }>(); // Add reportCategories to SharedData if passed globally, or ensure it's passed directly
    const authUser = props.auth?.user;
    const authUserId = authUser?.id;

    // Use the categories passed via props
    const currentReportCategories = reportCategories || props.reportCategories || {};

    // ... useEffect for profilePosts ...
    useEffect(() => {
        setProfilePosts(user.posts || []);
    }, [user.posts]);

    // --- Handler for Report Submission ---
    const handleReport = (e: React.FormEvent) => {
        e.preventDefault();
        // Use forceFormData: true because we have a file input
        postReport(route('users.report', user.username), {
            forceFormData: true, // <-- Important for file uploads with Inertia useForm
            onSuccess: () => {
                resetReport();
                setIsReportOpen(false);
                // Optionally show a success notification
            },
            onError: (errors) => {
                console.error('Report submission failed:', errors);
            },
            // Reset form state even on errors if dialog closes
            onFinish: () => {
                // Consider if you want to reset always or only on success
            },
        });
    };

    // --- Handler for File Input Change ---
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Check file size (optional but recommended)
            const file = e.target.files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB (matches backend validation)
            if (file.size > maxSize) {
                // You could show an error message to the user here
                alert(`File size exceeds the limit of 5MB. Please choose a smaller file.`);
                setReportData('attachment', null); // Clear the invalid file
                e.target.value = ''; // Reset the input field
            } else {
                setReportData('attachment', file);
            }
        } else {
            setReportData('attachment', null);
        }
    };

    // ... other handlers (handleFriendRequest, handleAcceptRequest, handleRejectRequest, handleDeletePost, handleCommentButtonClick) ...

    // --- Handler for Like ---
    const handleLike = (postId: number) => {
        const originalPosts = [...profilePosts];
        setProfilePosts((prevPosts) =>
            prevPosts.map((post) =>
                post.id === postId
                    ? {
                          ...post,
                          likes: post.likes.some((like) => like.user_id === authUserId)
                              ? post.likes.filter((like) => like.user_id !== authUserId)
                              : [...post.likes, { id: Date.now(), user_id: authUserId!, post_id: postId }],
                      }
                    : post,
            ),
        );
        router.post(
            route('posts.like', { post: postId }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (_page) => {
                    // Use _page to indicate it's unused if needed by linter rules
                    // Success handled optimistically
                },
                onError: () => {
                    setProfilePosts(originalPosts);
                    console.error('Error liking post:', postId);
                },
            },
        );
    };

    const handleDeletePost = (postId: number) => {
        if (confirm('Are you sure you want to delete this post?')) {
            router.delete(route('posts.destroy', postId), {
                onSuccess: () => {
                    setProfilePosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
                },
                onError: (errors) => {
                    console.error('Error deleting post:', errors);
                    // Maybe show a notification
                },
                preserveScroll: true,
            });
        }
    };

    const handleCommentButtonClick = (post: Post) => {
        setSelectedPost(post);
        setCommentData('content', ''); // Reset comment field
        setCommentErrors({}); // Clear previous errors
        setCommentOpen(true);
    };

    // --- handleCommentSubmit using axios (ensure this is correct) ---
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Trim the comment content to remove whitespace
        let trimmedContent = commentData.content.trim();
        
        // Check if the comment is empty after trimming
        if (!trimmedContent) {
            setCommentErrors({ content: 'Comment cannot be empty' });
            return;
        }
        
        // Limit comment to 100 characters
        if (trimmedContent.length > 100) {
            trimmedContent = trimmedContent.substring(0, 100);
        }
        
        if (selectedPost) {
            const optimisticComment: Comment = {
                id: Date.now(),
                content: trimmedContent,
                created_at: new Date().toISOString(),
                user: {
                    id: authUser.id,
                    name: authUser.name,
                    username: authUser.username as string | undefined, // Cast based on potential type difference
                    avatar: authUser.avatar || null,
                    verification_status: authUser.verification_status as 'unverified' | 'pending' | 'verified' | undefined,
                },
            };
            const originalComments = selectedPost.comments;
            setProfilePosts((prev) => prev.map((p) => (p.id === selectedPost.id ? { ...p, comments: [...p.comments, optimisticComment] } : p)));
            setSelectedPost((prev) => (prev ? { ...prev, comments: [...prev.comments, optimisticComment] } : null));

            const formData = new FormData();
            formData.append('content', trimmedContent);

            axios
                .post(route('posts.comment', { post: selectedPost.id }), formData)
                .then((response) => {
                    const actualComment = response.data.comment as Comment;
                    if (actualComment) {
                        setProfilePosts((prev) =>
                            prev.map((p) =>
                                p.id === selectedPost.id
                                    ? { ...p, comments: p.comments.map((c) => (c.id === optimisticComment.id ? actualComment : c)) }
                                    : p,
                            ),
                        );
                        setSelectedPost((prev) =>
                            prev ? { ...prev, comments: prev.comments.map((c) => (c.id === optimisticComment.id ? actualComment : c)) } : null,
                        );
                    }
                    resetComment();
                })
                .catch((error) => {
                    console.error('Error adding comment:', error);
                    setProfilePosts((prev) => prev.map((p) => (p.id === selectedPost.id ? { ...p, comments: originalComments } : p)));
                    setSelectedPost((prev) => (prev ? { ...prev, comments: originalComments } : null));
                    setCommentErrors({ content: error.response?.data?.message || 'Failed to add comment.' });
                });
        }
    };

    // --- handleDeleteComment using router.delete (ensure this is correct) ---
    const handleDeleteComment = (commentId: number) => {
        if (confirm('Are you sure you want to delete this comment?') && selectedPost) {
            const postId = selectedPost.id;
            const originalComments = [...selectedPost.comments];
            setProfilePosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)));
            setSelectedPost((prev) => (prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : null));
            router.delete(route('comments.destroy', commentId), {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    console.error('Failed to delete comment');
                    setProfilePosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: originalComments } : p)));
                    setSelectedPost((prev) => (prev ? { ...prev, comments: originalComments } : null));
                },
            });
        }
    };

    const handleFriendRequest = () => {
        if (user.friend_request) {
            router.delete(route('friend-requests.cancel', user.friend_request.id), {
                preserveScroll: true,
                preserveState: false,
            });
        } else {
            router.post(route('friend-requests.send', user.username), {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    const handleAcceptRequest = () => {
        router.post(route('friend-requests.accept', user.friend_request?.id), {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handleRejectRequest = () => {
        router.post(route('friend-requests.reject', user.friend_request?.id), {
            preserveScroll: true,
            preserveState: false,
        });
    };

    // --- Breadcrumbs ---
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Profile', href: route('profile.show', user.username) }];
    const [activeTab, setActiveTab] = useState('posts');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name}'s Profile`} />
            <div className="mx-auto max-w-4xl px-4 py-8 pb-20 md:px-0 md:pb-8">
                {/* --- Profile Header ... --- */}
                <div className="relative mb-8 overflow-hidden rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 dark:to-black/80"></div>
                    <div className="relative p-6 md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
                            <UserAvatar user={user} className="size-24 shadow-lg ring-4 ring-white md:size-32 dark:ring-gray-900" linkable={false} />
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold md:text-3xl">{user.name}</h1>
                                <div className="mt-1 flex items-center gap-2">
                                    <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                                    {user.verification_status && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${
                                                user.verification_status === 'verified'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : user.verification_status === 'pending'
                                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                            }`}
                                        >
                                            {user.verification_status}
                                        </span>
                                    )}
                                </div>

                                {/* --- Action Buttons --- */}
                                <div className="mt-4 flex flex-wrap gap-4">
                                    {!isOwnProfile && (
                                        <>
                                            {/* Message Button */}
                                            <Button
                                                variant="default"
                                                className="gap-2"
                                                onClick={() => router.visit(route('messages.index', { recipient: user.username }))}
                                            >
                                                <EnvelopeIcon className="h-5 w-5" /> Message
                                            </Button>

                                            {/* Friend Status Buttons */}
                                            {user.is_friend ? (
                                                <Button variant="outline" className="gap-2 bg-green-50 text-green-600 ..." disabled>
                                                    {' '}
                                                    <HeartIconSolid className="h-5 w-5" /> Friends{' '}
                                                </Button>
                                            ) : user.friend_request ? (
                                                user.friend_request.sender_id === authUserId ? (
                                                    <Button
                                                        variant="outline"
                                                        className="gap-2 bg-yellow-50 text-yellow-600 ..."
                                                        onClick={handleFriendRequest}
                                                        disabled={processingReport}
                                                    >
                                                        {' '}
                                                        <HeartIcon className="h-5 w-5" /> Cancel Request{' '}
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            className="gap-2 bg-green-50 text-green-600 ..."
                                                            onClick={handleAcceptRequest}
                                                            disabled={processingReport}
                                                        >
                                                            {' '}
                                                            <HeartIcon className="h-5 w-5" /> Accept{' '}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="gap-2 bg-red-50 text-red-600 ..."
                                                            onClick={handleRejectRequest}
                                                            disabled={processingReport}
                                                        >
                                                            {' '}
                                                            <HeartIcon className="h-5 w-5" /> Reject{' '}
                                                        </Button>
                                                    </div>
                                                )
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="gap-2 bg-blue-50 text-blue-600 ..."
                                                    onClick={handleFriendRequest}
                                                    disabled={processingReport}
                                                >
                                                    {' '}
                                                    <HeartIcon className="h-5 w-5" /> Add Friend{' '}
                                                </Button>
                                            )}

                                            {/* --- Report User Dialog --- */}
                                            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="gap-2 text-red-500 hover:text-red-600">
                                                        <FlagIcon className="h-5 w-5" />
                                                        Report
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[525px]">
                                                    {' '}
                                                    {/* Slightly wider */}
                                                    <DialogHeader>
                                                        <DialogTitle>Report User: {user.name}</DialogTitle>
                                                        <DialogDescription>Help us understand the problem. What's going on?</DialogDescription>
                                                    </DialogHeader>
                                                    {/* --- Report Form --- */}
                                                    <form onSubmit={handleReport} className="space-y-4 pt-2">
                                                        {/* Category Select */}
                                                        <div>
                                                            <Label htmlFor="category">Category</Label>
                                                            <Select
                                                                value={reportData.category}
                                                                onValueChange={(value) => setReportData('category', value)}
                                                                // Removed required here, handled by backend validation
                                                            >
                                                                <SelectTrigger id="category">
                                                                    <SelectValue placeholder="Select a category" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.entries(currentReportCategories).map(([key, label]) => (
                                                                        <SelectItem key={key} value={key}>
                                                                            {label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {reportErrors.category && (
                                                                <p className="mt-1 text-sm text-red-500">{reportErrors.category}</p>
                                                            )}
                                                        </div>

                                                        {/* Reason Textarea */}
                                                        <div>
                                                            <Label htmlFor="reason">Reason</Label>
                                                            <Textarea
                                                                id="reason"
                                                                value={reportData.reason}
                                                                onChange={(e) => setReportData('reason', e.target.value)}
                                                                placeholder={`Provide details about why you are reporting ${user.username}...`}
                                                                className="min-h-[120px]"
                                                                // Removed required here, handled by backend validation
                                                            />
                                                            {reportErrors.reason && (
                                                                <p className="mt-1 text-sm text-red-500">{reportErrors.reason}</p>
                                                            )}
                                                        </div>

                                                        {/* Attachment Input */}
                                                        <div>
                                                            <Label htmlFor="attachment">Attach Evidence (Optional)</Label>
                                                            <Input
                                                                id="attachment"
                                                                type="file"
                                                                onChange={handleAttachmentChange}
                                                                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30"
                                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" // Match backend validation
                                                            />
                                                            {reportData.attachment && (
                                                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    <PaperClipIcon className="h-4 w-4" />
                                                                    <span>{reportData.attachment.name}</span>
                                                                </div>
                                                            )}
                                                            {reportErrors.attachment && (
                                                                <p className="mt-1 text-sm text-red-500">{reportErrors.attachment}</p>
                                                            )}
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                Max file size: 5MB. Allowed types: JPG, PNG, PDF, DOC, DOCX.
                                                            </p>
                                                        </div>

                                                        {/* Upload Progress (Optional) */}
                                                        {reportProgress && (
                                                            <div className="space-y-1">
                                                                <Label>Upload Progress</Label>
                                                                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                                    <div
                                                                        className="h-2.5 rounded-full bg-blue-600"
                                                                        style={{ width: `${reportProgress.percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                                <p className="text-right text-xs text-gray-500">{reportProgress.percentage}%</p>
                                                            </div>
                                                        )}

                                                        {/* Form Actions */}
                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsReportOpen(false);
                                                                    resetReport();
                                                                }} // Reset form on cancel
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit" disabled={processingReport} className="bg-red-600 hover:bg-red-700">
                                                                {processingReport ? 'Submitting...' : 'Submit Report'}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                    {/* --- End Report Form --- */}
                                                </DialogContent>
                                            </Dialog>
                                            {/* --- End Report User Dialog --- */}
                                        </>
                                    )}
                                </div>
                                {/* --- End Action Buttons --- */}
                            </div>{' '}
                            {/* End flex-1 */}
                        </div>{' '}
                        {/* End Header Inner Flex */}
                        {/* Profile Stats */}
                        <div className="mt-6 flex flex-wrap gap-6 border-t border-gray-200 pt-4 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <PhotoIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium">{profilePosts?.length || 0} Posts</span>
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
                                              year: 'numeric',
                                          })}`
                                        : 'Joined recently'}
                                </span>
                            </div>
                        </div>
                    </div>{' '}
                    {/* End relative p-6 */}
                </div>{' '}
                {/* End Header Container */}
                {/* --- Tabs Section ... --- */}
                <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6 w-full rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        <TabsTrigger value="posts" className="flex-1 rounded-lg">
                            {' '}
                            <PhotoIcon className="mr-2 h-4 w-4" /> Posts{' '}
                        </TabsTrigger>
                        <TabsTrigger value="friends" className="flex-1 rounded-lg">
                            {' '}
                            <UserGroupIcon className="mr-2 h-4 w-4" /> Friends{' '}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-0">
                        <h2 className="sr-only">Posts</h2>
                        <div className="space-y-6">
                            {/* Use profilePosts state */}
                            {profilePosts && profilePosts.length > 0 ? (
                                profilePosts.map((post) => (
                                    <PostItem
                                        key={post.id}
                                        // Cast post type if needed to satisfy PostItem's expected props, or adjust PostItem/Post interface
                                        post={post as any} // Temporary cast - investigate type mismatch if persists
                                        onLike={handleLike}
                                        // Cast handler type if needed, or ensure Post types match
                                        onComment={handleCommentButtonClick as any} // Temporary cast
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                {user.friends.map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-black"
                                        onClick={() => router.visit(route('profile.show', friend.username))}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <UserAvatar user={friend} className="size-14" />
                                        <div>
                                            <p className="font-medium">{friend.name}</p>
                                            <p className="text-sm text-gray-500">@{friend.username}</p>
                                            {friend.verification_status && (
                                                <span /* ... verification badge ... */> {friend.verification_status} </span>
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
                {/* --- Comment Dialog --- */}
                <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                    <DialogContent className="overflow-hidden p-0 sm:max-w-[500px]">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950 dark:to-indigo-950">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Add a Comment</DialogTitle>
                                {selectedPost && (
                                    <DialogDescription className="text-gray-600 dark:text-gray-300">
                                        Replying to <span className="font-medium">{selectedPost.user.name}</span>'s post
                                    </DialogDescription>
                                )}
                            </DialogHeader>
                        </div>
                        <div className="p-6">
                            {/* Existing Comments */}
                            {selectedPost && selectedPost.comments.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                                        {selectedPost.comments.length} {selectedPost.comments.length === 1 ? 'Comment' : 'Comments'}
                                    </h3>
                                    <div className="max-h-[250px] space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                                        {selectedPost.comments.map((comment) => (
                                            <div key={comment.id} className="flex items-start gap-3">
                                                <UserAvatar user={comment.user} className="size-8" />
                                                <div className="flex-1 rounded-lg bg-white p-3 shadow-sm dark:bg-black">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{comment.user.name}</span>
                                                        {comment.user.username && (
                                                            <span className="text-xs text-gray-500">@{comment.user.username}</span>
                                                        )}
                                                        <span className="ml-auto text-xs text-gray-400">
                                                            {' '}
                                                            {/* Time */}
                                                            {new Date(comment.created_at).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                            })}{' '}
                                                            -{' '}
                                                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                        {comment.user.id === authUserId && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="ml-1 h-6 w-6 text-gray-400 hover:text-red-500"
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                title="Delete comment"
                                                            >
                                                                <TrashIcon className="h-4 w-4" /> <span className="sr-only">Delete comment</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{
                                                        comment.content.length > 100 
                                                            ? comment.content.substring(0, 100).match(/.{1,20}/g)?.join('\n') + '...'
                                                            : comment.content.match(/.{1,20}/g)?.join('\n')
                                                    }</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Comment Input Form */}
                            <form onSubmit={handleCommentSubmit} className="space-y-5">
                                <div className="flex items-start gap-3">
                                    {authUser && <UserAvatar user={authUser} className="size-8 ring-2 ring-blue-100 dark:ring-blue-900" />}
                                    <div className="flex-1">
                                        <Textarea
                                            value={commentData.content}
                                            onChange={(e) => {
                                                // Limit input to 100 characters
                                                if (e.target.value.length <= 100) {
                                                    setCommentData('content', e.target.value);
                                                }
                                            }}
                                            placeholder="Write your comment..."
                                            maxLength={100}
                                            className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                        />
                                        {commentErrors.content && <p className="mt-1 text-sm text-red-500">{commentErrors.content}</p>}
                                        {commentData.content.length > 80 && (
                                            <p className="mt-1 text-xs text-amber-500">
                                                {100 - commentData.content.length} characters remaining (max 100)
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            resetComment();
                                            setCommentErrors({});
                                            setCommentOpen(false);
                                            setSelectedPost(null);
                                        }}
                                        className="..."
                                    >
                                        {' '}
                                        Cancel{' '}
                                    </Button>
                                    <Button type="submit" disabled={commentProcessing || !commentData.content.trim()} className="...">
                                        {' '}
                                        {commentProcessing ? 'Posting...' : 'Comment'}{' '}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
                {/* --- End Comment Dialog --- */}
            </div>{' '}
            {/* End Main Container */}
        </AppLayout>
    );
}
