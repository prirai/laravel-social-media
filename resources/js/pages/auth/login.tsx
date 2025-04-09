import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import axios from 'axios';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout'; // Fixed import path
import { cn } from '@/lib/utils';
import { handleLogoutEncryptionCleanup, clearPrivateKey } from '@/utils/crypto';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    // Check if we were redirected here due to session expiration
    useEffect(() => {
        // Look for session expiration message or query parameter
        const expired = new URLSearchParams(window.location.search).get('expired');
        
        if ((expired === '1') || (status && (
            status.includes('session has expired') || 
            status.includes('Session expired')
        ))) {
            // Clean up encryption keys if session expired
            clearPrivateKey();
        }
        
        // Pre-fetch a fresh CSRF token when the login page loads
        const refreshCsrfToken = async () => {
            try {
                const response = await axios.get('/csrf-token');
                if (response.data && response.data.csrf_token) {
                    // Update the meta tag
                    const metaTag = document.querySelector('meta[name="csrf-token"]');
                    if (metaTag) {
                        metaTag.setAttribute('content', response.data.csrf_token);
                    }
                }
            } catch (error) {
                console.error('Failed to refresh CSRF token on login page:', error);
            }
        };
        
        refreshCsrfToken();
    }, [status]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        post(route('login'), {
            onFinish: () => reset('password'),
            onSuccess: () => {
                // Login successful, no need for console logging
            }
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />
            <div className="relative mx-auto w-full max-w-md p-4 sm:p-6">
                <div className="absolute inset-0 -z-10">
                    <PlaceholderPattern className="size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                </div>
                
                <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    
                    <form className="flex flex-col gap-4" onSubmit={submit}>
                        {/* Hidden CSRF token field */}
                        <input 
                            type="hidden" 
                            name="_token" 
                            value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} 
                        />
                        
                        <div className="grid gap-4">
                            <div className="grid gap-1">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="email@example.com"
                                    className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                                        errors.email && 'border-red-500 dark:border-red-500'
                                    )}
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={route('password.request')} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Password"
                                    className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                                        errors.password && 'border-red-500 dark:border-red-500'
                                    )}
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="flex items-center">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    checked={data.remember}
                                    onClick={() => setData('remember', !data.remember)}
                                    tabIndex={3}
                                    className="mr-2 h-5 w-5 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-transparent rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                                    Remember me
                                </Label>
                            </div>
                            <Button 
                                type="submit" 
                                className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600" 
                                tabIndex={4} 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Log in'
                                )}
                            </Button>
                        </div>
                        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                            Don't have an account?{' '}
                            <TextLink href={route('register')} tabIndex={5} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                Sign up
                            </TextLink>
                        </div>
                    </form>
                    {status && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-600 dark:bg-green-900/30 dark:text-green-300">
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
