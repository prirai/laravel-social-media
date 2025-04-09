import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HeartIcon, ChatBubbleLeftIcon, DocumentIcon, CalendarIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import UserAvatar from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';

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

interface PostItemProps {
    post: Post;
    onLike: (postId: number) => void;
    onComment: (post: Post) => void;
    onDelete?: (postId: number) => void;
}

export default function PostItem({ post, onLike, onComment, onDelete }: PostItemProps) {
    const { auth } = usePage<SharedData>().props;
    const authUserId = auth.user?.id;
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [localComments, setLocalComments] = useState<Comment[]>(post.comments || []);
    const [isDeletingComment, setIsDeletingComment] = useState<number | null>(null);

    useEffect(() => {
        setLocalComments(post.comments || []);
    }, [post.comments]);

    const handleImageClick = (imagePath: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Opening image:", imagePath);
        setEnlargedImage(imagePath);
        setIsImageModalOpen(true);
    };

    const handleDeleteComment = async (commentId: number) => {
        if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
            // Set deleting state to show loading indicator
            setIsDeletingComment(commentId);
            
            // Optimistically update the UI
            setLocalComments(prevComments => 
                prevComments.filter(comment => comment.id !== commentId)
            );

            try {
                // Check if this is a temporary ID (from Date.now())
                if (commentId > 1000000000000) { // Date.now() generates timestamps in milliseconds
                    console.log('Skipping server request for temporary comment ID');
                    setIsDeletingComment(null);
                    return;
                }
                
                // Use Inertia router for proper navigation
                router.delete(route('comments.destroy', commentId), {
                    preserveScroll: true,
                    onFinish: () => {
                        setIsDeletingComment(null);
                    },
                    onError: () => {
                        // Revert the optimistic update on error
                        setLocalComments(prevComments => {
                            // Find the comment in the original post comments
                            const originalComment = post.comments.find(c => c.id === commentId);
                            if (originalComment) {
                                // Add it back to the local comments
                                return [...prevComments, originalComment].sort((a, b) => 
                                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                );
                            }
                            return prevComments;
                        });
                        setIsDeletingComment(null);
                    }
                });
            } catch (error) {
                console.error('Error deleting comment:', error);
                setIsDeletingComment(null);
            }
        }
    };

    return (
        <>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-black">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <UserAvatar user={post.user} className="size-10" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{post.user.name}</span>
                                    <span className="text-sm text-gray-500">@{post.user.username}</span>
                                    {post.user.verification_status === 'verified' && (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <CalendarIcon className="h-3 w-3" />
                                    <time dateTime={post.created_at}>
                                        {new Date(post.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </time>
                                </div>
                            </div>
                        </div>

                        {post.user.id === authUserId && onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500"
                                onClick={() => onDelete(post.id)}
                            >
                                <TrashIcon className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    <div className="mt-3 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {post.content.length > 250 
                            ? post.content.substring(0, 250) + '...'
                            : post.content
                        }
                    </div>

                    {post.attachments.length > 0 && (
                        <div className={`mt-3 grid gap-2 ${post.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {post.attachments.map((attachment) => (
                                <div key={attachment.id} className="overflow-hidden rounded-lg">
                                    {attachment.file_type.includes('image') ? (
                                        <img
                                            src={attachment.file_path}
                                            alt="Attachment"
                                            className="w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                            onClick={(e) => handleImageClick(attachment.file_path, e)}
                                        />
                                    ) : (
                                        <a
                                            href={attachment.file_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center rounded-lg bg-gray-100 p-6 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                        >
                                            <DocumentIcon className="h-10 w-10 text-gray-500" />
                                            <span className="ml-2 font-medium">View Document</span>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t px-4 py-3 bg-white dark:bg-black">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => onLike(post.id)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {post.likes?.some((like) => like.user_id === authUserId) ? (
                                <HeartIconSolid className="h-7 w-7 text-red-500 transition-transform hover:scale-110" />
                            ) : (
                                <HeartIcon className="h-7 w-7 text-gray-500 transition-transform hover:scale-110 hover:text-red-500" />
                            )}
                            <span className="text-sm font-medium">
                                {post.likes?.length || 0}
                            </span>
                        </button>

                        <button
                            onClick={() => onComment(post)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ChatBubbleLeftIcon className="h-7 w-7 text-gray-500 transition-transform hover:scale-110 hover:text-blue-500" />
                            <span className="text-sm font-medium">
                                {localComments.length || 0}
                            </span>
                        </button>
                    </div>
                </div>

                {localComments.length > 0 && (
                    <div className="border-t bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
                        <div className="space-y-3">
                            {/* Show only the oldest 3 comments */}
                            {localComments.slice(0, 3).map((comment) => (
                                <div 
                                    key={comment.id} 
                                    className={`flex items-start gap-3 transition-opacity duration-200 ${
                                        isDeletingComment === comment.id ? 'opacity-50' : ''
                                    }`}
                                >
                                    <UserAvatar user={comment.user} className="size-8" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{comment.user.name}</span>
                                            <span className="text-sm text-gray-500">@{comment.user.username}</span>
                                            {comment.user.id === authUserId && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto h-6 w-6 text-gray-400 hover:text-red-500"
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    disabled={isDeletingComment === comment.id}
                                                >
                                                    {isDeletingComment === comment.id ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                                                    ) : (
                                                        <TrashIcon className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{
                                            comment.content.length > 100 
                                                ? comment.content.substring(0, 100).match(/.{1,20}/g)?.join('\n') + '...'
                                                : comment.content.match(/.{1,20}/g)?.join('\n')
                                        }</p>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Show "Show More Comments" button if there are more than 3 comments */}
                            {localComments.length > 3 && (
                                <button
                                    onClick={() => onComment(post)}
                                    className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                                >
                                    Show More Comments
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isImageModalOpen && enlargedImage && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80" 
                    onClick={() => setIsImageModalOpen(false)}
                    style={{ 
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw]" style={{ maxWidth: '90vw' }}>
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
                            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                            style={{ maxWidth: '90vw', maxHeight: '85vh' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
} 