import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { ChatBubbleLeftIcon, DocumentIcon, ExclamationCircleIcon, HeartIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        username?: string;
        avatar?: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified';
    };
}

interface Post {
    id: number;
    content: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        username: string;
        avatar: string;
        verification_status?: 'unverified' | 'pending' | 'verified';
        is_friend?: boolean;
    };
    attachments: Array<{
        id: number;
        file_path: string;
        file_type: string;
    }>;
    likes: Array<{
        id: number;
        user_id: number;
        post_id: number;
    }>;
    comments: Comment[];
}

interface PageProps {
    comment?: Comment;
}

interface DashboardProps {
    posts: Post[];
}

export default function Dashboard({ posts: initialPosts = [] }: DashboardProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [isOpen, setIsOpen] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [commentErrors, setCommentErrors] = useState<{ [key: string]: string }>({});
    const { auth } = usePage<SharedData & PageProps>().props;
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        data,
        setData,
        post,
        processing,
        errors: formErrors,
        reset,
        progress,
    } = useForm({
        content: '',
        attachments: [] as File[],
        document: null as File | null,
        notes: '',
    });

    const authUserId = auth.user?.id;

    const handleLike = (postId: number) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.id === postId
                    ? {
                          ...post,
                          likes: post.likes.some((like) => like.user_id === authUserId)
                              ? post.likes.filter((like) => like.user_id !== authUserId)
                              : [...post.likes, { id: Date.now(), user_id: authUserId, post_id: postId }],
                      }
                    : post
            )
        );

        post(route('posts.like', { post: postId }), {
            onError: () => {
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post.id === postId
                            ? {
                                  ...post,
                                  likes: post.likes.some((like) => like.user_id === authUserId)
                                      ? post.likes.filter((like) => like.user_id !== authUserId)
                                      : post.likes.slice(0, -1),
                              }
                            : post
                    )
                );
            },
        });
    };

    const {
        data: commentData,
        setData: setCommentData,
        post: postComment,
        processing: commentProcessing,
        reset: resetComment,
    } = useForm({
        content: '',
    });

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPost) {
            // Create an optimistic comment
            const optimisticComment: Comment = {
                id: Date.now(), // Temporary ID
                content: commentData.content,
                created_at: new Date().toISOString(),
                user: {
                    id: auth.user.id,
                    name: auth.user.name,
                    username: typeof auth.user.username === 'string' ? auth.user.username : undefined,
                    avatar: auth.user.avatar || null,
                    verification_status: auth.user.verification_status as 'unverified' | 'pending' | 'verified' | undefined,
                },
            };

            // Update UI immediately with optimistic comment
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === selectedPost.id
                        ? {
                              ...post,
                              comments: [...post.comments, optimisticComment],
                          }
                        : post
                )
            );

            // Clear comment input and close dialog
            setCommentData('content', '');
            setCommentOpen(false);
            setSelectedPost(null);

            // Send request to server
            postComment(route('posts.comment', { post: selectedPost.id }), {
                onSuccess: (page) => {
                    const newComment = page.props.comment as Comment;
                    if (newComment) {
                        // Update with the real comment from server
                        setPosts((prevPosts) =>
                            prevPosts.map((post) =>
                                post.id === selectedPost.id
                                    ? {
                                          ...post,
                                          comments: post.comments.map((comment) =>
                                              comment.id === optimisticComment.id ? newComment : comment
                                          ),
                                      }
                                    : post
                            )
                        );
                    }
                },
                onError: (errors) => {
                    // Remove the optimistic comment on error
                    setPosts((prevPosts) =>
                        prevPosts.map((post) =>
                            post.id === selectedPost.id
                                ? {
                                      ...post,
                                      comments: post.comments.filter((comment) => comment.id !== optimisticComment.id),
                                  }
                                : post
                        )
                    );
                    setCommentErrors(errors);
                    setCommentData('content', commentData.content);
                    setCommentOpen(true);
                    setSelectedPost(selectedPost);
                },
            });
        }
    };

    const handleVerificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('user.submit-verification'), {
            forceFormData: true,
            onSuccess: () => {
                setIsVerificationOpen(false);
            },
        });
    };

    const handleDeletePost = (postId: number) => {
        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            router.delete(route('posts.destroy', postId), {
                onSuccess: () => {
                    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
                },
            });
        }
    };

    const handleDeleteComment = (commentId: number) => {
        if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
            // Optimistically update the UI
            setPosts((prevPosts) =>
                prevPosts.map((post) => ({
                    ...post,
                    comments: post.comments.filter((comment) => comment.id !== commentId),
                }))
            );

            router.delete(route('comments.destroy', commentId), {
                onError: () => {
                    // Revert the optimistic update on error
                    setPosts((prevPosts) =>
                        prevPosts.map((post) => ({
                            ...post,
                            comments: post.comments.filter((comment) => comment.id !== commentId),
                        }))
                    );
                },
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (auth.user.verification_status !== 'verified') {
            setError('Only verified users can create posts.');
            return;
        }

        post(route('posts.store'), {
            onSuccess: (page) => {
                const newPost = page.props.post as Post;
                if (newPost) {
                    setPosts((prevPosts) => [newPost, ...prevPosts]);
                }
                reset();
                setIsOpen(false);
            },
            onError: (errors) => {
                setError(errors.content || 'An error occurred while creating the post.');
            },
        });
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const maxSize = 5 * 1024 * 1024;

            const oversizedFiles: string[] = [];
            const validFiles: File[] = [];

            newFiles.forEach((file) => {
                if (file.size > maxSize) {
                    oversizedFiles.push(file.name);
                } else {
                    validFiles.push(file);
                }
            });

            if (oversizedFiles.length > 0) {
                const errorMessage = `The following files exceed the 5MB limit: ${oversizedFiles.join(', ')}`;
                setData('attachments', [...data.attachments, ...validFiles]);
                setCommentErrors((prevErrors) => ({
                    ...prevErrors,
                    attachments: errorMessage,
                }));
            } else {
                setData('attachments', [...data.attachments, ...validFiles]);
            }
        }
    };

    const removeAttachment = (index: number) => {
        const updatedAttachments = [...data.attachments];
        updatedAttachments.splice(index, 1);
        setData('attachments', updatedAttachments);
    };

    return (
        <>
            <AppHeader breadcrumbs={breadcrumbs} />
            <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4 md:px-0">
                <Head title="Dashboard" />

                {auth.user.verification_status === 'unverified' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                        <div className="flex items-center gap-3">
                            <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
                            <div className="flex-1">
                                <p className="font-medium text-amber-800 dark:text-amber-200">Your account is not yet verified</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300">Submit a verification document to unlock all features.</p>
                            </div>
                            <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-amber-200 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                                    >
                                        Submit Verification
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Submit Verification Document</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleVerificationSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="document">Document</Label>
                                            <Input
                                                id="document"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => setData('document', e.target.files?.[0] || null)}
                                                required
                                            />
                                            <p className="mt-1 text-sm text-gray-500">Accepted formats: PDF, JPG, PNG</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Any additional information..."
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsVerificationOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing}>
                                                Submit
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full md:w-auto">
                                <PlusIcon className="mr-2 h-5 w-5" />
                                Create Post
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle>Create New Post</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="content">Post Content</Label>
                                    <Textarea
                                        id="content"
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        placeholder="What's on your mind?"
                                        className="min-h-[150px]"
                                    />
                                    {formErrors.content && <p className="text-sm text-red-500">{formErrors.content}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="attachments">Attachments</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            className="flex items-center gap-2"
                                        >
                                            <PhotoIcon className="h-5 w-5" />
                                            <DocumentIcon className="h-5 w-5" />
                                            Add Files
                                        </Button>
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            onChange={handleAttachmentChange}
                                            accept="image/*,.pdf"
                                            multiple
                                            className="hidden"
                                        />
                                    </div>

                                    {data.attachments.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-sm font-medium">Selected files:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {data.attachments.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-2 rounded bg-gray-100 p-2 dark:bg-gray-800">
                                                        {file.type.includes('image') ? (
                                                            <PhotoIcon className="h-4 w-4" />
                                                        ) : (
                                                            <DocumentIcon className="h-4 w-4" />
                                                        )}
                                                        <span className="max-w-[200px] truncate text-sm">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(index)}
                                                            className="text-sm text-red-500"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formErrors.attachments && <p className="text-sm text-red-500">{formErrors.attachments}</p>}
                                </div>

                                {progress && (
                                    <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${progress.percentage}%` }}></div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            reset();
                                            setIsOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Posting...' : 'Post'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-4">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post.id} className="rounded-xl border shadow-sm">
                                <div className="border-b p-4">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar user={post.user} className="size-10" />
                                        <div className="flex-1">
                                            <p className="font-medium">{post.user.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>@{post.user.username}</span>
                                                {post.user.is_friend && (
                                                    <span className="text-xs text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Friends</span>
                                                )}
                                                {post.user.verification_status && (
                                                    <span className="text-xs text-gray-500">({post.user.verification_status})</span>
                                                )}
                                                <span>•</span>
                                                <span>{new Date(post.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {post.user.id === authUserId && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-500 hover:text-red-500"
                                                onClick={() => handleDeletePost(post.id)}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 p-4">
                                    <div className="text-base whitespace-pre-wrap">{post.content}</div>

                                    {post.attachments.length > 0 && (
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
                                                                    height: 'auto',
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={attachment.file_path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
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
                                            {post.likes.some((like) => like.user_id === authUserId) ? (
                                                <HeartIconSolid className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <HeartIcon className="h-6 w-6" />
                                            )}
                                            <span className="text-sm font-medium">{post.likes.length}</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSelectedPost(post);
                                                setCommentOpen(true);
                                            }}
                                            className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                                        >
                                            <ChatBubbleLeftIcon className="h-6 w-6" />
                                            <span className="text-sm font-medium">{post.comments.length}</span>
                                        </button>
                                    </div>
                                </div>

                                {post.comments.length > 0 && (
                                    <div className="border-t bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
                                        <div className="space-y-3">
                                            {post.comments.map((comment) => (
                                                <div key={comment.id} className="flex items-start gap-3">
                                                    <UserAvatar user={comment.user} className="size-8" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{comment.user.name}</span>
                                                            <span className="text-sm text-gray-500">@{comment.user.username}</span>
                                                            {comment.user.verification_status && (
                                                                <span className="text-sm text-gray-500">({comment.user.verification_status})</span>
                                                            )}
                                                            {comment.user.id === authUserId && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="ml-auto h-6 w-6 text-gray-500 hover:text-red-500"
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            )}
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
                        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border">
                            <p className="mb-4 text-lg font-medium">No posts yet</p>
                            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Create Your First Post
                            </Button>
                            <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    )}
                </div>

                <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add a Comment</DialogTitle>
                            {selectedPost && <DialogDescription>Replying to {selectedPost.user.name}'s post</DialogDescription>}
                        </DialogHeader>
                        <form onSubmit={handleCommentSubmit} className="space-y-4">
                            <Textarea
                                value={commentData.content}
                                onChange={(e) => setCommentData('content', e.target.value)}
                                placeholder="Write your comment..."
                                className="min-h-[100px]"
                            />
                            {commentErrors.content && <p className="text-sm text-red-500">{commentErrors.content}</p>}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={commentProcessing}>
                                    {commentProcessing ? 'Posting...' : 'Comment'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
