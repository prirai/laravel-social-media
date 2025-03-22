import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ChatBubbleLeftIcon, DocumentIcon, HeartIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline'; // Import like/comment icons
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'; // Import solid heart icon
import { Head, useForm, usePage } from '@inertiajs/react'; // Add usePage
import { useState } from 'react';
import UserAvatar from '@/components/user-avatar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

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

export default function Dashboard({ posts = [] }: { posts: Post[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null); // State to hold the post for the comment modal
    const [commentErrors, setCommentErrors] = useState<{ [key: string]: string }>({}); // State for individual comment error.

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
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const { props } = usePage();
    const authUserId = (props.auth as any)?.user?.id; // Get authenticated user ID (handle type casting)

    const handleLike = (postId: number) => {
        post(route('posts.like', { post: postId }));
    };

    const {
        data: commentData,
        setData: setCommentData,
        post: postComment,
        processing: commentProcessing,
        errors: commentFormErrors,
        reset: resetComment,
    } = useForm({
        content: '',
    });

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPost) {
            postComment(route('posts.comment', { post: selectedPost.id }), {
                onSuccess: () => {
                    resetComment();
                    setCommentOpen(false);
                    setSelectedPost(null); // Clear the selected post
                },
                onError: (errors) => {
                    setCommentErrors(errors);
                },
            });
        }
    };

    // ... (handleSubmit, handleAttachmentChange, removeAttachment methods remain the same)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('posts.store'), {
            onSuccess: () => {
                reset();
                setIsOpen(false);
            },
        });
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes

            // Check each file for size before adding
            const oversizedFiles: string[] = [];
            const validFiles: File[] = [];

            newFiles.forEach((file) => {
                if (file.size > maxSize) {
                    oversizedFiles.push(file.name);
                } else {
                    validFiles.push(file);
                }
            });

            // Show error for oversized files
            if (oversizedFiles.length > 0) {
                // Set error message for too large files
                const errorMessage = `The following files exceed the 5MB limit: ${oversizedFiles.join(', ')}`;
                setErrors((prev) => ({
                    ...prev,
                    attachments: errorMessage,
                }));

                // Optional: Create a toast/notification for better visibility
                alert(`File size error: ${errorMessage}`);
            }

            // Add only valid files to the form data
            setData('attachments', [...data.attachments, ...validFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        const updatedAttachments = [...data.attachments];
        updatedAttachments.splice(index, 1);
        setData('attachments', updatedAttachments);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4 md:px-0">
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

                                    {/* Preview attachments */}
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
                                                <span>•</span>
                                                <span>{new Date(post.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-4">
                                    <div className="whitespace-pre-wrap text-base">{post.content}</div>

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
        </AppLayout>
    );
}
