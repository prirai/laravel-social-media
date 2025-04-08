import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react'; // Import useState

import InputError from '@/components/input-error';
import PasswordStrengthIndicator, { checkPasswordStrength } from '@/components/password-strength-indicator'; // Import the indicator and helper
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils'; // Import cn if needed for styling
import { handleLogoutEncryptionCleanup } from '@/utils/crypto';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    // State to track password strength
    const [isPasswordStrong, setIsPasswordStrong] = useState(false);

    // Clear encryption keys when resetting password
    useEffect(() => {
        handleLogoutEncryptionCleanup();
    }, []);

    // Update password strength state when password changes
    useEffect(() => {
        setIsPasswordStrong(checkPasswordStrength(data.password));
    }, [data.password]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!isPasswordStrong) {
            console.warn('Attempted submission with a weak password.');
            return; // Prevent submission
        }
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Reset password" description="Please enter your new password below">
            <Head title="Reset password" />

            <form onSubmit={submit}>
                <div className="grid gap-6">
                    {/* Email Input (Read Only) */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            className="mt-1 block w-full bg-gray-100 dark:bg-gray-700" // Style readonly field
                            readOnly
                            onChange={(e) => setData('email', e.target.value)} // Still needed for useForm
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    {/* Password Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            value={data.password}
                            className={cn('mt-1 block w-full', errors.password && 'border-red-500')}
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="New password"
                        />
                        {/* Add Password Strength Indicator */}
                        {data.password && <PasswordStrengthIndicator password={data.password} />}
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            className={cn('mt-1 block w-full', errors.password_confirmation && 'border-red-500')}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm new password"
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        disabled={processing || !isPasswordStrong || !data.password_confirmation || data.password !== data.password_confirmation} // Disable if processing, weak, or no match
                    >
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Reset password
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
