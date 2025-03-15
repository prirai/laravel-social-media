import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DocumentIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Define Post type for TypeScript
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
        avatar?: string;
    };
}

export default function Dashboard({ posts = [] }: { posts: Post[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [localErrors, setLocalErrors] = useState<{ [key: string]: string }>({});

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        content: '',
        attachments: [] as File[],
    });

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
                setLocalErrors((prev) => ({
                    ...prev,
                    attachments: errorMessage,
                }));
            } else {
                // Clear the error if all files are valid
                setLocalErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.attachments;
                    return newErrors;
                });
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Create Post Button */}
                <div className="mb-4 flex justify-end">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <PlusIcon className="h-5 w-5" />
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
                                    {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
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

                                    {/* Display local error message for attachment size */}
                                    {localErrors.attachments && <p className="mt-1 text-sm text-red-500">{localErrors.attachments}</p>}

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

                                    {errors.attachments && <p className="text-sm text-red-500">{errors.attachments}</p>}
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

                {/* Post List */}
                <div className="flex-1 space-y-4">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post.id} className="rounded-xl border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                                        {post.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{post.user.name}</p>
                                        <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mb-3 whitespace-pre-wrap">{post.content}</div>

                                {post.attachments.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                                        {post.attachments.map((attachment) => (
                                            <div key={attachment.id} className="relative overflow-hidden rounded-lg">
                                                {attachment.file_type.includes('image') ? (
                                                    <img src={attachment.file_path} alt="Attachment" className="h-auto w-full object-cover" />
                                                ) : (
                                                    <a
                                                        href={attachment.file_path}
                                                        target="_blank"
                                                        className="flex items-center justify-center rounded-lg bg-gray-100 p-4 dark:bg-gray-800"
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
                        ))
                    ) : (
                        <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden rounded-xl border">
                            <p className="mb-4 text-lg font-medium">No posts yet</p>
                            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Create Your First Post
                            </Button>
                            <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    )}
                </div>

                {/* Stats cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
