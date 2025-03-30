import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCardIcon, BanknotesIcon, QrCodeIcon, CurrencyDollarIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import UserAvatar from '@/components/user-avatar';

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

export default function MarketplacePayment({ listing }: { listing: Listing }) {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaymentComplete, setIsPaymentComplete] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Marketplace',
            href: '/marketplace',
        },
        {
            title: listing.title,
            href: `/marketplace/payment/${listing.id}`,
        },
    ];

    const handlePayment = () => {
        setIsProcessing(true);
        
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            setIsPaymentComplete(true);
        }, 2000);
    };

    const handleBackToMarketplace = () => {
        router.get(route('marketplace.index'));
    };

    const nextImage = () => {
        if (listing.images.length > 0) {
            setCurrentImageIndex((prevIndex) => 
                prevIndex === listing.images.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const prevImage = () => {
        if (listing.images.length > 0) {
            setCurrentImageIndex((prevIndex) => 
                prevIndex === 0 ? listing.images.length - 1 : prevIndex - 1
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pay for ${listing.title}`} />
            <div className="flex flex-col gap-6 p-4">
                <Button 
                    variant="ghost" 
                    className="w-fit flex items-center gap-2" 
                    onClick={handleBackToMarketplace}
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Marketplace
                </Button>

                {isPaymentComplete ? (
                    <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-300" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold">Payment Successful!</h2>
                        <p className="mb-6 text-muted-foreground">
                            Thank you for your purchase. The seller has been notified and will contact you soon.
                        </p>
                        <Button onClick={handleBackToMarketplace}>Return to Marketplace</Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Product Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{listing.title}</CardTitle>
                                <CardDescription>
                                    Listed by {listing.seller?.name || 'Unknown Seller'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {listing.images.length > 0 ? (
                                    <div className="relative h-[300px] overflow-hidden rounded-md">
                                        <img 
                                            src={listing.images[currentImageIndex]} 
                                            alt={listing.title} 
                                            className="h-full w-full object-contain"
                                        />
                                        
                                        {listing.images.length > 1 && (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80"
                                                    onClick={prevImage}
                                                >
                                                    &lt;
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80"
                                                    onClick={nextImage}
                                                >
                                                    &gt;
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-[300px] items-center justify-center rounded-md bg-muted">
                                        <p className="text-muted-foreground">No images available</p>
                                    </div>
                                )}
                                
                                {/* Thumbnail navigation for multiple images */}
                                {listing.images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {listing.images.map((image, index) => (
                                            <button
                                                key={index}
                                                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                                                    currentImageIndex === index ? 'border-primary' : 'border-transparent'
                                                }`}
                                                onClick={() => setCurrentImageIndex(index)}
                                            >
                                                <img 
                                                    src={image} 
                                                    alt={`Thumbnail ${index + 1}`} 
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <div>
                                    <h3 className="mb-2 font-semibold">Description</h3>
                                    <p className="text-sm text-muted-foreground">{listing.description}</p>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Category:</span>
                                        <span className="text-sm text-muted-foreground">{listing.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Seller:</span>
                                        <div className="flex items-center gap-1">
                                            <UserAvatar 
                                                user={listing.seller || { 
                                                    name: 'Unknown User',
                                                    avatar: null,
                                                    username: 'unknown',
                                                    verification_status: 'unverified'
                                                }} 
                                                className="size-5" 
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {listing.seller?.name || 'Unknown User'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <div className="text-2xl font-bold">₹{listing.price}</div>
                            </CardFooter>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                                <CardDescription>
                                    Choose your preferred payment method
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="card" className="flex flex-col items-center gap-1 py-3">
                                            <CreditCardIcon className="h-5 w-5" />
                                            <span className="text-xs">Card</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="upi" className="flex flex-col items-center gap-1 py-3">
                                            <QrCodeIcon className="h-5 w-5" />
                                            <span className="text-xs">UPI</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="netbanking" className="flex flex-col items-center gap-1 py-3">
                                            <BanknotesIcon className="h-5 w-5" />
                                            <span className="text-xs">Net Banking</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="bitcoin" className="flex flex-col items-center gap-1 py-3">
                                            <CurrencyDollarIcon className="h-5 w-5" />
                                            <span className="text-xs">Bitcoin</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="card" className="mt-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="card-number">Card Number</Label>
                                            <Input id="card-number" placeholder="1234 5678 9012 3456" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiry">Expiry Date</Label>
                                                <Input id="expiry" placeholder="MM/YY" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvv">CVV</Label>
                                                <Input id="cvv" placeholder="123" type="password" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name on Card</Label>
                                            <Input id="name" placeholder="John Doe" />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="upi" className="mt-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="upi-id">UPI ID</Label>
                                            <Input id="upi-id" placeholder="yourname@upi" />
                                        </div>
                                        <div className="rounded-md bg-muted p-4 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                You will receive a payment request on your UPI app
                                            </p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="netbanking" className="mt-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank">Select Bank</Label>
                                            <select 
                                                id="bank" 
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                            >
                                                <option value="">Select your bank</option>
                                                <option value="sbi">State Bank of India</option>
                                                <option value="hdfc">HDFC Bank</option>
                                                <option value="icici">ICICI Bank</option>
                                                <option value="axis">Axis Bank</option>
                                                <option value="kotak">Kotak Mahindra Bank</option>
                                            </select>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            You will be redirected to your bank's website to complete the payment
                                        </p>
                                    </TabsContent>

                                    <TabsContent value="bitcoin" className="mt-4 space-y-4">
                                        <div className="rounded-md bg-muted p-4 text-center">
                                            <p className="mb-2 font-medium">Bitcoin Address</p>
                                            <p className="mb-4 break-all text-xs text-muted-foreground">
                                                3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5
                                            </p>
                                            <div className="mx-auto h-40 w-40 bg-white p-2">
                                                {/* This would be a QR code in a real implementation */}
                                                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-xs text-gray-500">QR Code</span>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-sm text-muted-foreground">
                                                Send exactly {(listing.price / 3500000).toFixed(8)} BTC to this address
                                            </p>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay ₹${listing.price}`
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 