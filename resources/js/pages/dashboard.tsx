import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/user-avatar';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { ChatBubbleLeftIcon, DocumentIcon, ExclamationCircleIcon, HeartIcon, PhotoIcon, PlusIcon, TrashIcon, UserGroupIcon, CalendarIcon, BellIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, Fragment } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import PostItem from '@/components/post-item';

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
    const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [animatedPosts, setAnimatedPosts] = useState<number[]>([]);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);

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

    useEffect(() => {
        const timer = setTimeout(() => {
            const postIds = initialPosts.map(post => post.id);
            setAnimatedPosts(postIds);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [initialPosts]);

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
            const optimisticComment: Comment = {
                id: Date.now(),
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

            setCommentData('content', '');
            setCommentOpen(false);
            setSelectedPost(null);

            postComment(route('posts.comment', { post: selectedPost.id }), {
                onSuccess: (page) => {
                    const newComment = page.props.comment as Comment;
                    if (newComment) {
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
            setPosts((prevPosts) =>
                prevPosts.map((post) => ({
                    ...post,
                    comments: post.comments.filter((comment) => comment.id !== commentId),
                }))
            );

            router.delete(route('comments.destroy', commentId), {
                onError: () => {
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

        if (!auth.user.email_verified_at) {
            setError('You must verify your email to create a post.');
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 5000);
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

    const handleEmailVerificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    
        post(route('user.verify-email'), {
            onSuccess: () => {
                setIsEmailVerificationOpen(false);
            },
        });
    };
    
    const handleImageClick = (imagePath: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Opening image:", imagePath);
        setEnlargedImage(imagePath);
        setIsImageModalOpen(true);
    };

    const handleError = (message: string) => {
        setError(message);
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 5000);
    };

    return (
        <>
                <Head title="Dashboard" />
            <AppHeader breadcrumbs={breadcrumbs} />

            <div className="container mx-auto max-w-5xl px-4 py-8 md:px-6">
                <div className="mb-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-gray-900 shadow-sm dark:from-gray-900 dark:to-blue-950 dark:text-white">
                        <div className="absolute inset-0 bg-pattern opacity-5"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4">
                                <UserAvatar user={auth.user} className="size-16 ring-4 ring-white/30 shadow-md" />
                                <div>
                                    <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {auth.user.name}!</h1>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="text-gray-600 dark:text-gray-300">@{auth.user.username}</span>
                                        
                                        {/* Document Verification Status */}
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            auth.user.verification_status === 'verified' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                : auth.user.verification_status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                            <span className="mr-1 size-2 rounded-full ${
                                                auth.user.verification_status === 'verified' 
                                                    ? 'bg-green-500' 
                                                    : auth.user.verification_status === 'pending'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-gray-500'
                                            }"></span>
                                            {auth.user.verification_status === 'verified' 
                                                ? 'Verified' 
                                                : auth.user.verification_status === 'pending'
                                                ? 'Verification Pending'
                                                : 'Unverified'
                                            }
                                        </span>
                                        
                                        {/* Email Verification Status */}
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            auth.user.email_verified_at 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            <span className={`mr-1 size-2 rounded-full ${
                                                auth.user.email_verified_at 
                                                    ? 'bg-blue-500' 
                                                    : 'bg-red-500'
                                            }`}></span>
                                            {auth.user.email_verified_at ? 'Email Verified' : 'Email Unverified'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="mt-4 max-w-2xl text-gray-600 dark:text-gray-300">
                                Stay connected with your friends and discover what's happening in your community.
                            </p>
                            
                            <div className="mt-6 flex flex-wrap items-center gap-4">
                                {auth.user.email_verified_at ? (
                                    <Button 
                                        onClick={() => setIsOpen(true)}
                                        className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    >
                                        <PlusIcon className="mr-2 h-5 w-5" />
                                        Create Post
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => handleError('You must verify your email before creating posts.')}
                                        className="bg-gray-400 text-white hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                        <PlusIcon className="mr-2 h-5 w-5" />
                                        Create Post
                                    </Button>
                                )}
                                
                                <Button 
                                    variant="outline" 
                                    className="border-gray-300 bg-white/80 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-700"
                                    onClick={() => router.visit(route('messages.index'))}
                                >
                                    <EnvelopeIcon className="mr-2 h-5 w-5" />
                                    Messages
                                </Button>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-indigo-100/50 blur-2xl dark:bg-indigo-900/30"></div>
                        <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-blue-100/50 blur-xl dark:bg-blue-900/30"></div>
                    </div>
                </div>

                <div className="mb-8 space-y-4">
                {auth.user.verification_status === 'unverified' && (
                        <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm dark:border-amber-900 dark:from-amber-900/20 dark:to-amber-800/20">
                            <div className="flex items-center gap-4 p-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <ExclamationCircleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            <div className="flex-1">
                                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Your account is not yet verified</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Submit a verification document to unlock all features and build trust with other users.
                                    </p>
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

                            {!auth.user.email_verified_at && (
                        <div className="overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm dark:border-blue-900 dark:from-blue-900/20 dark:to-blue-800/20">
                            <div className="flex items-center gap-4 p-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <ExclamationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">Your email is not verified</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Verify your email to ensure account security and receive important notifications.
                                    </p>
                                </div>

                            <Dialog open={isEmailVerificationOpen} onOpenChange={setIsEmailVerificationOpen}>
                            <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                            >
                                Verify Email
                            </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Verify Your Email</DialogTitle>
                                    <DialogDescription>We will send a verification link to your registered email.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleEmailVerificationSubmit} className="space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Click the button below to receive a verification email.
                                    </p>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsEmailVerificationOpen(false)}>
                                            Cancel
                                        </Button>
                                                <Button type="submit" disabled={processing}>Send Verification Email</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        </div>
                    </div>
                )}
                </div>

                {/* <div className="sticky bottom-6 z-10 mb-6 flex justify-end lg:hidden">
                    <Button 
                        onClick={() => setIsOpen(true)} 
                        size="lg"
                        className="rounded-full shadow-lg"
                    >
                        <PlusIcon className="h-6 w-6" />
                            </Button>
                </div> */}

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Posts</h2>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950 dark:to-indigo-950">
                            <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Create a Post</DialogTitle>
                                        <DialogDescription className="text-gray-600 dark:text-gray-300">
                                            Share your thoughts, photos, or documents with your community.
                                        </DialogDescription>
                            </DialogHeader>
                                </div>
                                
                                <div className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="flex items-start gap-3">
                                            <UserAvatar user={auth.user} className="size-10 ring-2 ring-blue-100 dark:ring-blue-900" />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{auth.user.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">@{auth.user.username}</p>
                                            </div>
                                            </div>
                                
                                        <div>
                                    <Textarea
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        placeholder="What's on your mind?"
                                                className="min-h-[150px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                    />
                                            {formErrors.content && <p className="mt-1 text-sm text-red-500">{formErrors.content}</p>}
                                </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="attachments" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Add Photos or Documents
                                                </Label>
                                                {data.attachments.length > 0 && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {data.attachments.length} {data.attachments.length === 1 ? 'file' : 'files'} selected
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <label
                                                    htmlFor="attachments"
                                                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <PlusIcon className="h-6 w-6 text-gray-400" />
                                                        <span className="mt-1 text-xs text-gray-500">Add</span>
                                                    </div>
                                        <Input
                                                        id="attachments"
                                            type="file"
                                            multiple
                                            className="hidden"
                                                        onChange={handleAttachmentChange}
                                                        accept="image/*,.pdf,.doc,.docx"
                                        />
                                                </label>

                                                {data.attachments.map((file, index) => (
                                                    <div key={index} className="relative h-20 w-20">
                                                        {file.type.includes('image') ? (
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={file.name}
                                                                className="h-full w-full rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                                                <DocumentIcon className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                                                            onClick={() => removeAttachment(index)}
                                                        >
                                                            <XMarkIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                    {formErrors.attachments && <p className="text-sm text-red-500">{formErrors.attachments}</p>}
                                </div>

                                {progress && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{progress.percentage}%</span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-in-out dark:bg-blue-400"
                                                        style={{ width: `${progress.percentage}%` }}
                                                    ></div>
                                                </div>
                                    </div>
                                )}

                                        <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            reset();
                                            setIsOpen(false);
                                        }}
                                                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                            >
                                        {processing ? 'Posting...' : 'Post'}
                                    </Button>
                                </div>
                            </form>
                                </div>
                        </DialogContent>
                    </Dialog>
                </div>

                    {posts.length > 0 ? (
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <PostItem 
                                    key={post.id}
                                    post={post}
                                    onLike={handleLike}
                                    onComment={(post) => {
                                        setSelectedPost(post);
                                        setCommentOpen(true);
                                    }}
                                    onDelete={post.user.id === authUserId ? handleDeletePost : undefined}
                                />
                            ))}
                            
                            {/* "All caught up" message */}
                            <div className="mt-10 mb-14 text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                                            </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-4 text-sm font-medium text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                                            You're all caught up ✨
                                        </span>
                                    </div>
                                </div>
                            </div>
                                                        </div>
                                                    ) : (
                        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border bg-white p-12 dark:bg-black">
                            <div className="mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-5 shadow-inner dark:from-blue-900/30 dark:to-indigo-900/30">
                                <PhotoIcon className="h-14 w-14 text-blue-500" />
                            </div>
                            <h3 className="mb-2 text-2xl font-semibold">No posts yet</h3>
                            <p className="mb-6 max-w-md text-center text-gray-500 dark:text-gray-400">
                                Be the first to share something with your community.
                            </p>
                            
                            <Button 
                                onClick={() => {
                                    if (!auth.user.email_verified_at) {
                                        handleError('You must verify your email before creating posts.');
                                    } else {
                                        setIsOpen(true);
                                    }
                                }} 
                                className={`flex items-center gap-2 ${
                                    auth.user.email_verified_at 
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                                        : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
                                } text-white shadow-md`}
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create Your First Post
                            </Button>
                            
                            <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                                        </div>
                                    )}
                                </div>

                <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                    <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
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
                            {selectedPost && selectedPost.comments.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                                        {selectedPost.comments.length} {selectedPost.comments.length === 1 ? 'Comment' : 'Comments'}
                                    </h3>
                                    <div className="max-h-[250px] space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                                        {selectedPost.comments.map((comment) => (
                                            <div key={comment.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${selectedPost.comments.indexOf(comment) * 50}ms` }}>
                                                    <UserAvatar user={comment.user} className="size-8" />
                                                <div className="flex-1 rounded-lg bg-white p-3 shadow-sm dark:bg-black">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{comment.user.name}</span>
                                                        <span className="text-xs text-gray-500">@{comment.user.username}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                        {comment.user.verification_status === 'verified' && (
                                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                Verified
                                                            </span>
                                                            )}
                                                            {comment.user.id === authUserId && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                className="ml-auto h-6 w-6 text-gray-400 hover:text-red-500"
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                                                </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            
                            <form onSubmit={handleCommentSubmit} className="space-y-5">
                                <div className="flex items-start gap-3">
                                    <UserAvatar user={auth.user} className="size-8 ring-2 ring-blue-100 dark:ring-blue-900" />
                                    <div className="flex-1">
                            <Textarea
                                value={commentData.content}
                                onChange={(e) => setCommentData('content', e.target.value)}
                                placeholder="Write your comment..."
                                            className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                        />
                                        {commentErrors.content && <p className="mt-1 text-sm text-red-500">{commentErrors.content}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            resetComment();
                                            setCommentOpen(false);
                                        }}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={commentProcessing}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                    >
                                    {commentProcessing ? 'Posting...' : 'Comment'}
                                </Button>
                            </div>
                        </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {isImageModalOpen && enlargedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setIsImageModalOpen(false)}>
                    <div className="relative max-h-[90vh] max-w-[90vw]">
                        <button 
                            className="absolute -right-4 -top-4 rounded-full bg-white p-2 text-gray-800 shadow-lg hover:bg-gray-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsImageModalOpen(false);
                            }}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <img 
                            src={enlargedImage} 
                            alt="Enlarged view" 
                            className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {showErrorPopup && error && (
                <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="rounded-lg bg-amber-50 p-4 shadow-lg border border-amber-200 dark:bg-amber-900 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-amber-800 dark:text-amber-200">{error}</p>
                            </div>
                            <button 
                                className="flex-shrink-0 rounded-md p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-800"
                                onClick={() => setShowErrorPopup(false)}
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
