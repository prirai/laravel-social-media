import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { CurrencyRupeeIcon, PhotoIcon, PlusIcon, TagIcon, ExclamationCircleIcon, CheckCircleIcon, ComputerDesktopIcon, TruckIcon, HomeIcon, TrophyIcon, ShoppingBagIcon, BookOpenIcon, Squares2X2Icon, EllipsisHorizontalCircleIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import UserAvatar from '@/components/user-avatar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Marketplace',
        href: '/marketplace',
    },
];

const categories = [
    {
        name: 'All Categories',
        icon: Squares2X2Icon,
    },
    {
        name: 'Electronics',
        icon: ComputerDesktopIcon,
    },
    {
        name: 'Vehicles',
        icon: TruckIcon,
    },
    {
        name: 'Property',
        icon: HomeIcon,
    },
    {
        name: 'Sports',
        icon: TrophyIcon,
    },
    {
        name: 'Fashion',
        icon: ShoppingBagIcon,
    },
    {
        name: 'Books',
        icon: BookOpenIcon,
    },
    {
        name: 'Other',
        icon: EllipsisHorizontalCircleIcon,
    },
] as const;

interface Listing {
    id: number;
    title: string;
    price: number;
    category: string;
    description: string;
    images: string[];
    status: 'unverified' | 'verified';
    seller: {
        name: string;
        username: string;
        avatar: string | null;
        verification_status: 'unverified' | 'verified' | 'pending';
    } | null;
    created_at: string;
}

export default function Marketplace({ listings: initialListings = [], flash = {} }: { listings: Listing[], flash: unknown }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
    const [listings, setListings] = useState<Listing[]>(initialListings);
    const { auth } = usePage<SharedData>().props;
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);

    // Add this function to filter listings
    const filteredListings = useMemo(() => {
        if (selectedCategory === 'All Categories') {
            return listings;
        }
        return listings.filter(listing => listing.category === selectedCategory);
    }, [listings, selectedCategory]);

    const handleDeleteListing = (listingId: number) => {
        if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            // Optimistically update the UI
            setListings((prevListings) => prevListings.filter((listing) => listing.id !== listingId));

            router.delete(route('marketplace.destroy', listingId), {
                onError: () => {
                    // Revert the optimistic update on error
                    setListings((prevListings) => [...prevListings]);
                },
            });
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        price: '',
        category: '',
        description: '',
        images: [] as File[],
        document: null as File | null,
        notes: '',
    });

    const handleError = (message: string) => {
        setError(message);
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 5000);
    };

    const handleSuccess = (message: string) => {
        setSuccessMessage(message);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 5000);
    };

    const resetVerificationForm = () => {
        (data as any).document = null;
        (data as any).notes = '';
    };

    const handleVerificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // We need to send the document through FormData
        if (!(data as any).document) {
            alert('Please select a document to upload');
            return;
        }

        // Set loading state
        const submitButton = e.currentTarget.querySelector('button[type="submit"]');
        if (submitButton instanceof HTMLButtonElement) {
            submitButton.innerHTML = 'Submitting...';
            submitButton.disabled = true;
        }

        // Create FormData manually and append the document
        const formData = new FormData();
        formData.append('document', (data as any).document);
        formData.append('notes', (data as any).notes || '');

        // Using a different approach to avoid linter errors with FormData
        const url = route('user.submit-verification');

        // Perform fetch manually
        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {
            // Success handling
            setIsVerificationOpen(false);
            // Reset form
            resetVerificationForm();
            // Show success message
            handleSuccess('Verification document submitted successfully. It will be reviewed by our team.');

            // Optionally refresh the page to update user status
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting verification document. Please try again.');

            // Reset button state on error
            if (submitButton instanceof HTMLButtonElement) {
                submitButton.innerHTML = 'Submit';
                submitButton.disabled = false;
            }
        });
    };

    // Add a handler to check verification before opening the create listing dialog
    const handleCreateListingClick = () => {
        if (auth.user.verification_status !== 'verified') {
            handleError('You must verify your document before creating listings in the marketplace.');
            return;
        }
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (auth.user.verification_status !== 'verified') {
            handleError('You must verify your document before creating listings in the marketplace.');
            return;
        }

        // Create FormData object to properly handle file uploads
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('price', data.price);
        formData.append('category', data.category);
        formData.append('description', data.description);

        // Append each image file
        data.images.forEach((image: File) => {
            formData.append('images[]', image);
        });

        post(route('marketplace.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setIsOpen(false);
            },
        });
    };

    // Inside the Marketplace component, add a new function to handle clicking on a listing
    const handleListingClick = (listingId: number) => {
        router.get(route('marketplace.payment', listingId));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Marketplace" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Flash message section */}
                {flash.success && (
                    <div className="rounded-md bg-green-50 p-4 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                {flash.error && (
                    <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Information Card - Moved to top */}
                <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                    <div className="space-y-4">
                        <div className="flex items-start gap-2">
                            <div className="mt-1 flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <p>
                                Listings marked with an exclamation mark (
                                <span className="text-amber-500">!</span>
                                ) are pending verification by our administrators.
                            </p>
                        </div>

                        <div className="flex items-start gap-2">
                            <div className="mt-1 flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            </div>
                            <p>
                                Listings marked with a checkmark (
                                <span className="text-green-500">✓</span>
                                ) have been reviewed by our administrators for basic compliance with our listing guidelines.
                            </p>
                        </div>

                        <div className="mt-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/50">
                            <p className="text-amber-800 dark:text-amber-200">
                                <strong>Disclaimer:</strong> While we strive to maintain a safe marketplace, buyers are solely responsible
                                for verifying the authenticity and condition of items before making a purchase. Our verification process
                                is limited to basic listing compliance. We do not guarantee the quality, safety, or legitimacy of any
                                listed items. The site and its administrators shall not be held liable for any losses, damages, or harm
                                arising from transactions between users.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header with Create Listing button and Category filter */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => {
                            const CategoryIcon = category.icon;
                            return (
                                <Button
                                    key={category.name}
                                    variant={selectedCategory === category.name ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(category.name)}
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <CategoryIcon className="h-4 w-4" />
                                    {category.name}
                                </Button>
                            );
                        })}
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="flex items-center gap-2"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent default to handle manually
                                    handleCreateListingClick();
                                }}
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create Listing
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle>Create New Listing</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="What are you selling?"
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price</Label>
                                        <div className="relative">
                                            <CurrencyRupeeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                                            <Input
                                                id="price"
                                                type="number"
                                                value={data.price}
                                                onChange={(e) => setData('price', e.target.value)}
                                                className="pl-10"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            className="w-full rounded-md border border-input px-3 py-2"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.slice(1).map((category) => (
                                                <option key={category.name} value={category.name}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe your item..."
                                        className="min-h-[100px]"
                                    />
                                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Photos</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                            className="flex items-center gap-2"
                                        >
                                            <PhotoIcon className="h-5 w-5" />
                                            Add Photos
                                        </Button>
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setData('images', Array.from(e.target.files));
                                                }
                                            }}
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                        />
                                    </div>
                                    {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Listing'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit Verification Document</DialogTitle>
                                <DialogDescription>
                                    Verify your identity to start selling in the marketplace.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleVerificationSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="verification-document">Document</Label>
                                    <Input
                                        id="verification-document"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                // Use a separate handler to avoid TypeScript errors
                                                const formData = new FormData();
                                                formData.append('document', file);
                                                // Store the file reference for form submission
                                                (data as any).document = file;
                                            }
                                        }}
                                        required
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Accepted formats: PDF, JPG, PNG</p>
                                </div>
                                <div>
                                    <Label htmlFor="verification-notes">Additional Notes (Optional)</Label>
                                    <Textarea
                                        id="verification-notes"
                                        value={(data as any).notes}
                                        onChange={(e) => {
                                            // Use a separate handler to avoid TypeScript errors
                                            (data as any).notes = e.target.value;
                                        }}
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

                {/* Listings Grid */}
                {filteredListings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredListings.map((listing) => (
                            <div
                                key={listing.id}
                                className="overflow-hidden rounded-xl border shadow-sm cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => handleListingClick(listing.id)}
                            >
                                <div className="relative h-[200px] w-full flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                    {listing.images[0] ? (
                                        <>
                                            <div
                                                className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                                                style={{
                                                    backgroundImage: `url(${listing.images[0]})`,
                                                }}
                                            />
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                className={`h-full w-auto object-contain relative z-10 transition-opacity duration-300 ${
                                                    loadedImages[listing.images[0]] ? 'opacity-100' : 'opacity-0'
                                                }`}
                                                onLoad={() => {
                                                    setLoadedImages(prev => ({
                                                        ...prev,
                                                        [listing.images[0]]: true
                                                    }));
                                                }}
                                            />
                                            {!loadedImages[listing.images[0]] && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{listing.title}</h3>
                                            {listing.status === 'unverified' ? (
                                                <span className="text-amber-500">
                                                    <ExclamationCircleIcon className="h-5 w-5" />
                                                </span>
                                            ) : (
                                                <span className="text-green-500">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold">₹{listing.price}</span>
                                        </div>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-600">{listing.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const CategoryIcon = categories.find(c => c.name === listing.category)?.icon || TagIcon;
                                                return <CategoryIcon className="h-4 w-4 text-gray-500" />;
                                            })()}
                                            <span className="text-sm text-gray-500">{listing.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserAvatar
                                                user={listing.seller || {
                                                    name: 'Unknown User',
                                                    avatar: null,
                                                    username: 'unknown',
                                                    verification_status: 'unverified'
                                                }}
                                                className="size-6"
                                            />
                                            <span className="text-sm text-gray-500">
                                                {listing.seller?.name || 'Unknown User'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Separate the delete button to prevent navigation */}
                                            {auth.user && listing.seller?.username === auth.user.username && (
                                        <div className="mt-2 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-500 hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent navigation when clicking delete
                                                    handleDeleteListing(listing.id);
                                                }}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border">
                        <p className="mb-4 text-lg font-medium">
                            {selectedCategory === 'All Categories'
                                ? 'No listings yet'
                                : `No listings in ${selectedCategory}`}
                        </p>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                handleCreateListingClick();
                            }}
                            className="flex items-center gap-2"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Create First Listing
                        </Button>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                )}
            </div>

            {/* Error Popup */}
            {showErrorPopup && error && (
                <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="rounded-lg bg-amber-50 p-4 shadow-lg border border-amber-200 dark:bg-amber-900 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-amber-800 dark:text-amber-200">{error}</p>
                                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                    Please submit your verification documents to unlock marketplace selling features.
                                </p>
                            </div>
                            <button
                                className="flex-shrink-0 rounded-md p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-800"
                                onClick={() => setShowErrorPopup(false)}
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-200 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-300 dark:hover:bg-amber-800"
                                onClick={() => {
                                    setIsVerificationOpen(true);
                                    setShowErrorPopup(false);
                                }}
                            >
                                Submit Verification
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Popup */}
            {showSuccessPopup && successMessage && (
                <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="rounded-lg bg-green-50 p-4 shadow-lg border border-green-200 dark:bg-green-900 dark:border-green-800">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-green-800 dark:text-green-200">{successMessage}</p>
                            </div>
                            <button
                                className="flex-shrink-0 rounded-md p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-800"
                                onClick={() => setShowSuccessPopup(false)}
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
