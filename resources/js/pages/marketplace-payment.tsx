import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCardIcon, BanknotesIcon, QrCodeIcon, CurrencyDollarIcon, ArrowLeftIcon, CheckIcon, ExclamationCircleIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
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
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Validation states for different payment methods
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    });
    const [upiId, setUpiId] = useState('');
    const [selectedBank, setSelectedBank] = useState('');

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
        // Validate form based on selected payment method
        const errors: Record<string, string> = {};
        
        if (paymentMethod === 'card') {
            if (!cardDetails.number) errors.cardNumber = 'Card number is required';
            else if (!/^\d{16}$/.test(cardDetails.number.replace(/\s/g, ''))) 
                errors.cardNumber = 'Please enter a valid 16-digit card number';
            
            if (!cardDetails.expiry) errors.expiry = 'Expiry date is required';
            else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) 
                errors.expiry = 'Please use MM/YY format';
            
            if (!cardDetails.cvv) errors.cvv = 'CVV is required';
            else if (!/^\d{3,4}$/.test(cardDetails.cvv)) 
                errors.cvv = 'CVV must be 3 or 4 digits';
            
            if (!cardDetails.name) errors.name = 'Name is required';
        } else if (paymentMethod === 'upi') {
            if (!upiId) errors.upiId = 'UPI ID is required';
            else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) 
                errors.upiId = 'Please enter a valid UPI ID';
        } else if (paymentMethod === 'netbanking') {
            if (!selectedBank) errors.bank = 'Please select a bank';
        }
        
        setFormErrors(errors);
        
        // Only proceed if there are no errors
        if (Object.keys(errors).length === 0) {
            setIsProcessing(true);
            
            // Simulate payment processing
            setTimeout(() => {
                setIsProcessing(false);
                setIsPaymentComplete(true);
            }, 2000);
        }
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
            <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
                <Button 
                    variant="ghost" 
                    className="mb-6 w-fit flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" 
                    onClick={handleBackToMarketplace}
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Marketplace
                </Button>

                {isPaymentComplete ? (
                    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-md dark:border-gray-800 dark:bg-gray-900">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                            <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Payment Successful!</h2>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">
                            Thank you for your purchase. The seller has been notified and will contact you soon.
                        </p>
                        <Button 
                            onClick={handleBackToMarketplace}
                            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            Return to Marketplace
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-5">
                        {/* Product Details - wider section */}
                        <Card className="border-gray-200 overflow-hidden rounded-xl bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-3">
                            <CardHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{listing.title}</CardTitle>
                                    {listing.status === 'unverified' ? (
                                        <span className="text-amber-500" title="This listing is pending verification">
                                            <ExclamationCircleIcon className="h-5 w-5" />
                                        </span>
                                    ) : (
                                        <span className="text-green-500" title="This listing has been verified">
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Listed by {listing.seller?.name || 'Unknown Seller'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6">
                                {listing.images.length > 0 ? (
                                    <div className="relative h-[350px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                        {/* Add blurred background */}
                                        <div
                                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                                            style={{
                                                backgroundImage: `url(${listing.images[currentImageIndex]})`,
                                            }}
                                        />
                                        
                                        <img 
                                            src={listing.images[currentImageIndex]} 
                                            alt={listing.title} 
                                            className="h-full w-full object-contain relative z-10"
                                        />
                                        
                                        {listing.images.length > 1 && (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 z-20"
                                                    onClick={prevImage}
                                                >
                                                    &lt;
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 z-20"
                                                    onClick={nextImage}
                                                >
                                                    &gt;
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-[350px] items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                        <PhotoIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                                
                                {/* Thumbnail navigation for multiple images */}
                                {listing.images.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto py-2">
                                        {listing.images.map((image, index) => (
                                            <button
                                                key={index}
                                                className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                                                    currentImageIndex === index ? 'border-blue-500 shadow-md scale-105' : 'border-transparent'
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
                                
                                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/50">
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
                                    <p className="text-gray-600 dark:text-gray-300">{listing.description}</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">{listing.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seller:</span>
                                        <div className="flex items-center gap-1">
                                            <UserAvatar 
                                                user={listing.seller || { 
                                                    name: 'Unknown User',
                                                    avatar: null,
                                                    username: 'unknown',
                                                    verification_status: 'unverified'
                                                }} 
                                                className="size-6 ring-2 ring-white dark:ring-gray-800" 
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {listing.seller?.name || 'Unknown User'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Methods - narrower section */}
                        <Card className="border-gray-200 overflow-hidden rounded-xl bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
                            <div className="bg-blue-600 text-white dark:bg-blue-700 py-4 px-6 text-center">
                                <div className="text-4xl font-bold">₹{listing.price}</div>
                            </div>
                            <CardHeader className="border-b border-gray-100 bg-blue-50 dark:border-gray-800 dark:bg-blue-900/20">
                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-300">
                                    Choose your preferred payment method
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <TabsList className="grid w-full grid-cols-4 mb-10">
                                        <TabsTrigger value="card" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                            <CreditCardIcon className="h-5 w-5" />
                                            <span className="text-xs">Card</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="upi" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                            <QrCodeIcon className="h-5 w-5" />
                                            <span className="text-xs">UPI</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="netbanking" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                            <BanknotesIcon className="h-5 w-5" />
                                            <span className="text-xs">Net Banking</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="bitcoin" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700">
                                            <CurrencyDollarIcon className="h-5 w-5" />
                                            <span className="text-xs">Bitcoin</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="card" className="mt-8 space-y-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <div className="space-y-2">
                                            <Label htmlFor="card-number" className="text-gray-700 dark:text-gray-300">Card Number</Label>
                                            <Input 
                                                id="card-number" 
                                                placeholder="1234 5678 9012 3456" 
                                                value={cardDetails.number}
                                                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                                                className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 ${formErrors.cardNumber ? "border-red-500" : ""}`}
                                            />
                                            {formErrors.cardNumber && (
                                                <p className="text-xs text-red-500 mt-1">{formErrors.cardNumber}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiry" className="text-gray-700 dark:text-gray-300">Expiry Date</Label>
                                                <Input 
                                                    id="expiry" 
                                                    placeholder="MM/YY" 
                                                    value={cardDetails.expiry}
                                                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                                    className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 ${formErrors.expiry ? "border-red-500" : ""}`}
                                                />
                                                {formErrors.expiry && (
                                                    <p className="text-xs text-red-500 mt-1">{formErrors.expiry}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvv" className="text-gray-700 dark:text-gray-300">CVV</Label>
                                                <Input 
                                                    id="cvv" 
                                                    placeholder="123" 
                                                    type="password" 
                                                    value={cardDetails.cvv}
                                                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                                                    className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 ${formErrors.cvv ? "border-red-500" : ""}`}
                                                />
                                                {formErrors.cvv && (
                                                    <p className="text-xs text-red-500 mt-1">{formErrors.cvv}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Name on Card</Label>
                                            <Input 
                                                id="name" 
                                                placeholder="John Doe" 
                                                value={cardDetails.name}
                                                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                                                className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 ${formErrors.name ? "border-red-500" : ""}`}
                                            />
                                            {formErrors.name && (
                                                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="upi" className="mt-8 space-y-4 rounded-md border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <div className="space-y-2">
                                            <Label htmlFor="upi-id" className="text-gray-700 dark:text-gray-300">UPI ID</Label>
                                            <Input 
                                                id="upi-id" 
                                                placeholder="yourname@upi" 
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400 ${formErrors.upiId ? "border-red-500" : ""}`}
                                            />
                                            {formErrors.upiId && (
                                                <p className="text-xs text-red-500 mt-1">{formErrors.upiId}</p>
                                            )}
                                        </div>
                                        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-900/30">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                You will receive a payment request on your UPI app
                                            </p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="netbanking" className="mt-8 space-y-4 rounded-md border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank" className="text-gray-700 dark:text-gray-300">Select Bank</Label>
                                            <select 
                                                id="bank" 
                                                className={`w-full rounded-md border ${formErrors.bank ? "border-red-500" : "border-gray-300"} bg-white px-3 py-2 dark:bg-gray-800 dark:border-gray-600`}
                                                value={selectedBank}
                                                onChange={(e) => setSelectedBank(e.target.value)}
                                            >
                                                <option value="">Select your bank</option>
                                                <option value="sbi">State Bank of India</option>
                                                <option value="hdfc">HDFC Bank</option>
                                                <option value="icici">ICICI Bank</option>
                                                <option value="axis">Axis Bank</option>
                                                <option value="kotak">Kotak Mahindra Bank</option>
                                                <option value="union">Union Bank of India</option>
                                                <option value="indian">Indian Bank</option>
                                            </select>
                                            {formErrors.bank && (
                                                <p className="text-xs text-red-500 mt-1">{formErrors.bank}</p>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 border border-gray-200 bg-gray-50 p-4 rounded-md dark:border-gray-700 dark:bg-gray-800/50">
                                            You will be redirected to your bank's website to complete the payment
                                        </p>
                                    </TabsContent>

                                    <TabsContent value="bitcoin" className="mt-8 space-y-4 rounded-md border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bitcoin-address" className="text-gray-700 dark:text-gray-300">Bitcoin Address</Label>
                                                <div className="flex items-center">
                                                    <Input 
                                                        id="bitcoin-address" 
                                                        value="bc1qxyz123fake456address789abcdef0123456789" 
                                                        readOnly 
                                                        className="font-mono text-xs bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                                                    />
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="ml-2 border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText("bc1qxyz123fake456address789abcdef0123456789");
                                                            alert("Bitcoin address copied to clipboard");
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-center">
                                                <div className="h-48 w-48 border border-gray-300 p-2 bg-white rounded-lg shadow-sm dark:border-gray-600">
                                                    <img 
                                                        src="/img/btc-qr-code.svg" 
                                                        alt="Bitcoin QR Code" 
                                                        className="h-full w-full"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label className="text-gray-700 dark:text-gray-300">Amount to Send</Label>
                                                <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                                                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                                        {(listing.price / 3500000).toFixed(8)} BTC
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        ≈ ₹{listing.price}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 dark:text-gray-400 border border-gray-200 bg-gray-50 p-4 rounded-md dark:border-gray-700 dark:bg-gray-800/50">
                                                After sending the exact amount to the address above, click the Pay button to confirm your payment.
                                            </p>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                            <CardFooter className="border-t border-gray-100 bg-blue-50 p-6 dark:border-gray-800 dark:bg-blue-900/20">
                                <Button 
                                    className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm" 
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