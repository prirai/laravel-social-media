// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, KeyRound, Mail, Check } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import axios from 'axios';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import OtpKeyboard from '@/components/otp-keyboard';

// Create a custom axios instance that won't redirect on 401
const axiosInstance = axios.create();
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        // Don't redirect on 401 for auth pages
        if (error.response && error.response.status === 401) {
            // Just return the error for handling
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export default function ForgotPassword({ status }: { status?: string }) {
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [passwordReset, setPasswordReset] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [otpResendCountdown, setOtpResendCountdown] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ email: string }>>({
        email: '',
    });

    // Form for new password
    const { data: passwordData, setData: setPasswordData, reset: resetPasswordData } = useForm({
        password: '',
        password_confirmation: '',
    });

    // Disable notification fetching on auth pages
    useEffect(() => {
        // Add a class to the body to indicate this is an auth page
        document.body.classList.add('auth-page');
        
        return () => {
            document.body.classList.remove('auth-page');
        };
    }, []);

    // Handle countdown timer for OTP expiration
    useEffect(() => {
        if (otpResendCountdown > 0) {
            const countdownInterval = setInterval(() => {
                setOtpResendCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            return () => clearInterval(countdownInterval);
        }
    }, [otpResendCountdown]);

    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleEmailSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        // First step: Request OTP
        axiosInstance.post(route('user.password-reset.send-otp'), {
            email: data.email
        })
        .then(response => {
            setOtpSent(true);
            setOtpResendCountdown(300); // 5 minutes countdown for OTP expiration
            setSubmitting(false);
        })
        .catch(error => {
            setSubmitting(false);
            if (error.response && error.response.data && error.response.data.errors) {
                if (error.response.data.errors.email) {
                    // Set the error manually since we're using axios instead of the useForm hook
                    const errorEl = document.getElementById('email-error');
                    if (errorEl) {
                        errorEl.textContent = error.response.data.errors.email[0];
                        errorEl.classList.remove('hidden');
                    }
                }
            } else if (error.response && error.response.status === 401) {
                // Handle unauthorized error
                const errorEl = document.getElementById('email-error');
                if (errorEl) {
                    errorEl.textContent = "Authentication required. Please try again.";
                    errorEl.classList.remove('hidden');
                }
            } else {
                // Handle general error
                const errorEl = document.getElementById('email-error');
                if (errorEl) {
                    errorEl.textContent = "An error occurred. Please try again.";
                    errorEl.classList.remove('hidden');
                }
            }
        });
    };

    const handleVerifyOtp: FormEventHandler = (e) => {
        e.preventDefault();
        setVerifying(true);
        setOtpError(null);
        
        // Verify OTP
        axiosInstance.post(route('user.password-reset.verify-otp'), {
            otp: otpValue,
            email: data.email
        })
        .then(response => {
            setOtpVerified(true);
            setVerifying(false);
        })
        .catch(error => {
            setVerifying(false);
            if (error.response && error.response.data && error.response.data.errors) {
                if (error.response.data.errors.otp) {
                    setOtpError(error.response.data.errors.otp[0]);
                } else {
                    setOtpError('Invalid verification code. Please try again.');
                }
            } else if (error.response && error.response.status === 401) {
                setOtpError('Authentication required. Please try again.');
            } else {
                setOtpError('Something went wrong. Please try again.');
            }
        });
    };

    const handleResetPassword: FormEventHandler = (e) => {
        e.preventDefault();
        setResettingPassword(true);
        setPasswordError(null);
        
        // Reset password
        axiosInstance.post(route('user.password-reset.reset'), {
            email: data.email,
            password: passwordData.password,
            password_confirmation: passwordData.password_confirmation
        })
        .then(response => {
            setPasswordReset(true);
            setResettingPassword(false);
            resetPasswordData();
        })
        .catch(error => {
            setResettingPassword(false);
            if (error.response && error.response.data && error.response.data.errors) {
                const errors = error.response.data.errors;
                
                if (errors.password) {
                    setPasswordError(errors.password[0]);
                } else if (errors.password_confirmation) {
                    setPasswordError(errors.password_confirmation[0]);
                } else if (errors.email) {
                    setPasswordError(errors.email[0]);
                } else {
                    setPasswordError('An error occurred while resetting your password. Please try again.');
                }
            } else {
                setPasswordError('An error occurred while resetting your password. Please try again.');
            }
        });
    };

    const handleResendOtp = () => {
        axiosInstance.post(route('user.password-reset.send-otp'), {
            email: data.email
        })
        .then(response => {
            setOtpResendCountdown(300);
        })
        .catch(error => {
            setOtpError('Failed to resend verification code. Please try again.');
        });
    };

    const getTitle = () => {
        if (passwordReset) return "Password Reset Complete";
        if (otpVerified) return "Create New Password";
        if (otpSent) return "Enter verification code";
        return "Reset password";
    };

    const getDescription = () => {
        if (passwordReset) return "Your password has been successfully reset";
        if (otpVerified) return "Enter a new password for your account";
        if (otpSent) return `We've sent a verification code to ${data.email}`;
        return "Enter your email to receive a verification code";
    };

    return (
        <AuthLayout 
            title={getTitle()} 
            description={getDescription()}
        >
            <Head title="Forgot password" />

            <div className="relative mx-auto w-full max-w-md p-4 sm:p-6">
                <div className="absolute inset-0 -z-10">
                    <PlaceholderPattern className="size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                </div>

            <div className="space-y-6">
                    {status && (
                        <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-600 dark:bg-green-900/30 dark:text-green-300">
                            {status}
                        </div>
                    )}

                    {!otpSent ? (
                        // Step 1: Email Input Form
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                                    autoComplete="email"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                                    className={cn(
                                        "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400",
                                        errors.email && 'border-red-500 dark:border-red-500'
                                    )}
                                />
                                <InputError message={errors.email} id="email-error" />
                            </div>

                            <Button 
                                type="submit"
                                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600" 
                                disabled={processing || submitting}
                            >
                                {(processing || submitting) ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Sending verification code...
                                    </>
                                ) : (
                                    'Send verification code'
                                )}
                            </Button>
                        </form>
                    ) : !otpVerified ? (
                        // Step 2: OTP Verification Form
                        <div className="space-y-6">
                            <div className="rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-900/20">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                    <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-blue-800 dark:text-blue-300">Verification required</h3>
                                <p className="text-blue-700 dark:text-blue-400">
                                    Enter the 6-digit code we sent to your email to verify your identity.
                                </p>
                                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                    Code expires in {formatCountdown(otpResendCountdown)}
                                </p>
                            </div>
                            
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">Verification code</Label>
                                    
                                    {/* Hidden input to store the value for form submission */}
                                    <div className="hidden">
                                        <Input
                                            id="otp"
                                            type="text"
                                            value={otpValue}
                                            onChange={() => {}}
                                            readOnly
                                        />
                                    </div>
                                    
                                    {/* On-screen keyboard for OTP entry */}
                                    <OtpKeyboard
                                        value={otpValue}
                                        onChange={setOtpValue}
                                        disabled={verifying}
                                    />
                                    
                                    {otpError && <p className="text-sm text-red-500">{otpError}</p>}
                                </div>
                                
                                <Button 
                                    type="submit"
                                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600" 
                                    disabled={verifying || otpValue.length !== 6}
                                >
                                    {verifying ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify and continue'
                                    )}
                                </Button>
                            </form>
                            
                            <div className="text-center">
                                {otpResendCountdown > 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Didn't receive the code?
                                    </p>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="link"
                                        onClick={handleResendOtp}
                                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Resend verification code
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : !passwordReset ? (
                        // Step 3: New Password Form
                        <div className="space-y-6">
                            <div className="rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-900/20">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                    <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-blue-800 dark:text-blue-300">Create a new password</h3>
                                <p className="text-blue-700 dark:text-blue-400">
                                    Your identity has been verified. Please enter a new password for your account.
                                </p>
                            </div>
                            
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">New password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData('password', e.target.value)}
                                        placeholder="Enter new password"
                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                        autoFocus
                                    />
                                </div>
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation" className="text-gray-700 dark:text-gray-300">Confirm password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={passwordData.password_confirmation}
                                        onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                        placeholder="Confirm new password"
                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                    />
                                </div>
                                
                                {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                                
                                <Button 
                                    type="submit"
                                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600" 
                                    disabled={resettingPassword || !passwordData.password || !passwordData.password_confirmation}
                                >
                                    {resettingPassword ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Updating password...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        // Step 4: Password Reset Confirmation
                        <div className="space-y-6">
                            <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                    <Check className="h-6 w-6 text-green-600 dark:text-green-300" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-green-800 dark:text-green-300">Password reset successful</h3>
                                <p className="text-green-700 dark:text-green-400">
                                    Your password has been reset successfully. You can now log in with your new password.
                                </p>
                    </div>

                            <Button 
                                type="button"
                                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                onClick={() => window.location.href = route('login')}
                            >
                                Go to Login
                        </Button>
                        </div>
                    )}

                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <span>Remember your password? </span>
                        <TextLink 
                            href={route('login')} 
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Log in
                        </TextLink>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
