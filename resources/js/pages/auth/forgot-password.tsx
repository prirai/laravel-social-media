// Components
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Check, KeyRound, LoaderCircle } from 'lucide-react'; // Removed Mail
import { FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import OtpKeyboard from '@/components/otp-keyboard';
import PasswordStrengthIndicator, { checkPasswordStrength } from '@/components/password-strength-indicator'; // Import the indicator and helper
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';

// Create a custom axios instance that won't redirect on 401
const axiosInstance = axios.create();
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 for auth pages
        if (error.response && error.response.status === 401) {
            // Just return the error for handling
            return Promise.reject(error);
        }
        return Promise.reject(error);
    },
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
    const [isPasswordStrong, setIsPasswordStrong] = useState(false); // Add state for password strength

    const { data, setData, processing, errors } = useForm<Required<{ email: string }>>({
        // Removed unused post, reset
        email: '',
    });

    // Form for new password - keep using useForm for state management, but submit via axios
    const {
        data: passwordData,
        setData: setPasswordData,
        reset: resetPasswordData,
    } = useForm({
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

    // Update password strength state when new password changes
    useEffect(() => {
        if (otpVerified && !passwordReset) {
            // Only check when in the password reset step
            setIsPasswordStrong(checkPasswordStrength(passwordData.password));
        }
    }, [passwordData.password, otpVerified, passwordReset]);

    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleEmailSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setPasswordError(null); // Clear previous errors like email error
        const emailErrorEl = document.getElementById('email-error');
        if (emailErrorEl) emailErrorEl.textContent = ''; // Clear manual error display

        // First step: Request OTP
        axiosInstance
            .post(route('user.password-reset.send-otp'), {
                email: data.email,
            })
            .then(() => {
                // Removed unused response
                setOtpSent(true);
                setOtpResendCountdown(300); // 5 minutes countdown for OTP expiration
                setSubmitting(false);
            })
            .catch((error) => {
                setSubmitting(false);
                const errorEl = document.getElementById('email-error');
                if (errorEl) {
                    if (error.response && error.response.data && error.response.data.errors && error.response.data.errors.email) {
                        errorEl.textContent = error.response.data.errors.email[0];
                    } else if (error.response && error.response.status === 401) {
                        errorEl.textContent = 'Authentication required. Please try again.';
                    } else {
                        errorEl.textContent = 'An error occurred sending the verification code. Please try again.';
                    }
                    errorEl.classList.remove('hidden'); // Ensure it's visible
                } else {
                    // Fallback error handling if the element isn't found (less likely)
                    setPasswordError('An error occurred sending the verification code.');
                }
            });
    };

    const handleVerifyOtp: FormEventHandler = (e) => {
        e.preventDefault();
        setVerifying(true);
        setOtpError(null);

        // Verify OTP
        axiosInstance
            .post(route('user.password-reset.verify-otp'), {
                otp: otpValue,
                email: data.email,
            })
            .then(() => {
                // Removed unused response
                setOtpVerified(true);
                setVerifying(false);
            })
            .catch((error) => {
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
                    setOtpError('Something went wrong verifying the code. Please try again.');
                }
            });
    };

    const handleResetPassword: FormEventHandler = (e) => {
        e.preventDefault();
        if (!isPasswordStrong) {
            // Check strength before submitting
            setPasswordError('Password does not meet the strength requirements.');
            return;
        }
        setResettingPassword(true);
        setPasswordError(null); // Clear previous errors

        // Reset password using axios
        axiosInstance
            .post(route('user.password-reset.reset'), {
                email: data.email,
                password: passwordData.password,
                password_confirmation: passwordData.password_confirmation,
            })
            .then(() => {
                // Removed unused response
                setPasswordReset(true);
                setResettingPassword(false);
                resetPasswordData(); // Reset password form fields
            })
            .catch((error) => {
                setResettingPassword(false);
                if (error.response && error.response.data && error.response.data.errors) {
                    const backendErrors = error.response.data.errors;
                    // Prioritize specific errors
                    if (backendErrors.password) {
                        setPasswordError(backendErrors.password[0]);
                    } else if (backendErrors.password_confirmation) {
                        setPasswordError(backendErrors.password_confirmation[0]);
                    } else if (backendErrors.email) {
                        // Less likely but possible
                        setPasswordError(backendErrors.email[0]);
                    } else {
                        // General backend validation error message
                        setPasswordError('Validation failed. Please check the fields.');
                    }
                } else if (error.response && error.response.status === 401) {
                    setPasswordError('Authentication error during password reset.');
                } else {
                    // Network or other server error
                    setPasswordError('An error occurred while resetting your password. Please try again.');
                }
            });
    };

    const handleResendOtp = () => {
        setOtpError(null); // Clear previous errors
        axiosInstance
            .post(route('user.password-reset.send-otp'), {
                email: data.email,
            })
            .then(() => {
                // Removed unused response
                setOtpResendCountdown(300);
            })
            .catch(() => {
                // Removed unused error
                setOtpError('Failed to resend verification code. Please try again.');
            });
    };

    const getTitle = () => {
        if (passwordReset) return 'Password Reset Complete';
        if (otpVerified) return 'Create New Password';
        if (otpSent) return 'Enter verification code';
        return 'Reset password';
    };

    const getDescription = () => {
        if (passwordReset) return 'Your password has been successfully reset';
        if (otpVerified) return 'Enter a new password for your account';
        if (otpSent) return `We've sent a verification code to ${data.email}`;
        return 'Enter your email to receive a verification code';
    };

    return (
        <AuthLayout title={getTitle()} description={getDescription()}>
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
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                    Email address
                                </Label>
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
                                        'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                        errors.email && 'border-red-500 dark:border-red-500', // Use Inertia error state if available
                                    )}
                                />
                                {/* Manual error display, cleared on submit */}
                                <div id="email-error" className="mt-1 hidden text-sm text-red-500"></div>
                                {/* Display fallback error */}
                                {passwordError && passwordError.includes('email') && <InputError message={passwordError} />}
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                disabled={processing || submitting}
                            >
                                {processing || submitting ? (
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
                                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">Code expires in {formatCountdown(otpResendCountdown)}</p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
                                        Verification code
                                    </Label>

                                    {/* Hidden input to store the value for form submission */}
                                    <div className="hidden">
                                        <Input id="otp" type="text" value={otpValue} onChange={() => {}} readOnly />
                                    </div>

                                    {/* On-screen keyboard for OTP entry */}
                                    <OtpKeyboard value={otpValue} onChange={setOtpValue} disabled={verifying} />

                                    {otpError && <InputError message={otpError} className="mt-1" />}
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
                                        Didn't receive the code? Wait {formatCountdown(otpResendCountdown)}
                                    </p>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="link"
                                        onClick={handleResendOtp}
                                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        disabled={submitting} // Disable while resending
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
                                {/* New Password Input */}
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                        New password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData('password', e.target.value)}
                                        placeholder="Enter new password"
                                        className={cn(
                                            'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                            // Highlight if there's a password-specific error (not confirmation)
                                            passwordError &&
                                                passwordError.toLowerCase().includes('password') &&
                                                !passwordError.toLowerCase().includes('confirm') &&
                                                'border-red-500 dark:border-red-500',
                                        )}
                                        autoFocus
                                        disabled={resettingPassword}
                                    />
                                    {/* Add Password Strength Indicator */}
                                    {passwordData.password && <PasswordStrengthIndicator password={passwordData.password} />}
                                    {/* Display specific password error */}
                                    {passwordError &&
                                        passwordError.toLowerCase().includes('password') &&
                                        !passwordError.toLowerCase().includes('confirm') && <InputError message={passwordError} className="mt-1" />}
                                </div>

                                {/* Confirm Password Input */}
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation" className="text-gray-700 dark:text-gray-300">
                                        Confirm password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={passwordData.password_confirmation}
                                        onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                        placeholder="Confirm new password"
                                        className={cn(
                                            'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                            // Highlight if passwords don't match or confirmation-specific error
                                            ((passwordData.password &&
                                                passwordData.password_confirmation &&
                                                passwordData.password !== passwordData.password_confirmation) ||
                                                (passwordError && passwordError.toLowerCase().includes('confirm'))) &&
                                                'border-red-500 dark:border-red-500',
                                        )}
                                        disabled={resettingPassword}
                                    />
                                    {/* Display specific confirmation error */}
                                    {passwordError && passwordError.toLowerCase().includes('confirm') && (
                                        <InputError message={passwordError} className="mt-1" />
                                    )}
                                    {/* Display mismatch error */}
                                    {passwordData.password &&
                                        passwordData.password_confirmation &&
                                        passwordData.password !== passwordData.password_confirmation && (
                                            <InputError message="Passwords do not match." className="mt-1" />
                                        )}
                                </div>

                                {/* Display general password reset error (not specific to password/confirmation fields) */}
                                {passwordError && !passwordError.toLowerCase().includes('password') && (
                                    <InputError message={passwordError} className="mt-1" />
                                )}

                                {/* Reset Password Button */}
                                <Button
                                    type="submit"
                                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                    disabled={
                                        resettingPassword ||
                                        !passwordData.password ||
                                        !passwordData.password_confirmation ||
                                        passwordData.password !== passwordData.password_confirmation || // Check match
                                        !isPasswordStrong // Check strength
                                    }
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
                                onClick={() => (window.location.href = route('login'))}
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}

                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <span>Remember your password? </span>
                        <TextLink href={route('login')} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            Log in
                        </TextLink>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
