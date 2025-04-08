import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { handleLogoutEncryptionCleanup } from '@/utils/crypto';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react'; // Import useState, useEffect

import HeadingSmall from '@/components/heading-small';
import PasswordStrengthIndicator, { checkPasswordStrength } from '@/components/password-strength-indicator'; // Import the indicator
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: '/settings/password',
    },
];

type PasswordForm = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm<Required<PasswordForm>>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // State to track password strength
    const [isPasswordStrong, setIsPasswordStrong] = useState(false);

    // Update password strength state when the new password changes
    useEffect(() => {
        setIsPasswordStrong(checkPasswordStrength(data.password));
    }, [data.password]);

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        // Add frontend check before submitting (though button should be disabled)
        if (!isPasswordStrong) {
            // You might want to set a specific error state or rely on button disabling
            console.warn('Attempted to save a weak password.');
            return;
        }

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                // Password change requires regenerating encryption keys
                handleLogoutEncryptionCleanup();
            },
            onError: (errors) => {
                // Keep existing error handling
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Update password" description="Ensure your account is using a long, random password to stay secure" />

                    <form onSubmit={updatePassword} className="space-y-6">
                        {/* Current Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Current password</Label>
                            <Input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                type="password"
                                className={cn('mt-1 block w-full', errors.current_password && 'border-red-500')}
                                autoComplete="current-password"
                                placeholder="Current password"
                            />
                            <InputError message={errors.current_password} />
                        </div>

                        {/* New Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">New password</Label>
                            <Input
                                id="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                type="password"
                                className={cn('mt-1 block w-full', errors.password && 'border-red-500')}
                                autoComplete="new-password"
                                placeholder="New password"
                            />
                            {/* Add Password Strength Indicator */}
                            {data.password && <PasswordStrengthIndicator password={data.password} />}
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <Input
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                type="password"
                                className={cn('mt-1 block w-full', errors.password_confirmation && 'border-red-500')}
                                autoComplete="new-password"
                                placeholder="Confirm new password"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Save Button and Success Message */}
                        <div className="flex items-center gap-4">
                            <Button
                                disabled={
                                    processing || // Disable if processing
                                    !data.password || // Disable if no new password
                                    !isPasswordStrong || // Disable if password is weak
                                    !data.password_confirmation || // Disable if no confirmation
                                    data.password !== data.password_confirmation // Disable if passwords don't match
                                }
                            >
                                Save password
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Saved.</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
