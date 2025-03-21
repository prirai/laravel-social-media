import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CurrencyDollarIcon, PhotoIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import UserAvatar from '@/components/user-avatar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Marketplace',
        href: '/marketplace',
    },
];

const categories = [
    'All Categories',
    'Electronics',
    'Vehicles',
    'Property',
    'Sports',
    'Fashion',
    'Books',
    'Other',
];

export default function Marketplace({ listings = [], flash = {} }: { listings: any[], flash: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    
    // Add this function to filter listings
    const filteredListings = useMemo(() => {
        if (selectedCategory === 'All Categories') {
            return listings;
        }
        return listings.filter(listing => listing.category === selectedCategory);
    }, [listings, selectedCategory]);

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        title: '',
        price: '',
        category: '',
        description: '',
        images: [] as File[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
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
            data: formData,
            onSuccess: () => {
                reset();
                setIsOpen(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Marketplace" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Add this flash message section */}
                {flash.success && (
                    <div className="rounded-md bg-green-50 p-4 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                
                {/* Header with Create Listing button and Category filter */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                onClick={() => setSelectedCategory(category)}
                                size="sm"
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                    
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
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
                                            <CurrencyDollarIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
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
                                                <option key={category} value={category}>
                                                    {category}
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
                </div>

                {/* Listings Grid */}
                {filteredListings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredListings.map((listing) => (
                            <div key={listing.id} className="overflow-hidden rounded-xl border shadow-sm">
                                <div className="aspect-video overflow-hidden">
                                    {listing.images[0] ? (
                                        <img
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="font-semibold">{listing.title}</h3>
                                        <span className="text-lg font-bold">${listing.price}</span>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-600">{listing.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TagIcon className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">{listing.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserAvatar user={listing.seller} className="size-6" />
                                            <span className="text-sm text-gray-500">{listing.seller.name}</span>
                                        </div>
                                    </div>
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
                        <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                            <PlusIcon className="h-5 w-5" />
                            Create First Listing
                        </Button>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 