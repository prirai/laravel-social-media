import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react'; // Import useState and useEffect

import InputError from '@/components/input-error';
import PasswordStrengthIndicator, { checkPasswordStrength } from '@/components/password-strength-indicator'; // Import the indicator and helper
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AuthLayout from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';

type RegisterForm = {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    avatar?: File | null;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        avatar: null,
    });

    // State to track password strength
    const [isPasswordStrong, setIsPasswordStrong] = useState(false);

    // Update password strength state when password changes
    useEffect(() => {
        setIsPasswordStrong(checkPasswordStrength(data.password));
    }, [data.password]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Double-check strength before submitting (though button should be disabled)
        if (!isPasswordStrong) {
            // Optionally set an error or simply rely on the disabled button
            console.warn('Attempted submission with a weak password.');
            return;
        }
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('avatar', e.target.files[0]);
        } else {
            setData('avatar', null);
        }
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <div className="relative mx-auto w-full max-w-md p-4 sm:p-6">
                <div className="absolute inset-0 -z-10">
                    <PlaceholderPattern className="size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        <div className="grid gap-5">
                            {/* Name Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                    placeholder="Full name"
                                    className={cn(
                                        'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                        errors.name && 'border-red-500 dark:border-red-500',
                                    )}
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            {/* Username Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    disabled={processing}
                                    placeholder="Choose a username"
                                    className={cn(
                                        'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                        errors.username && 'border-red-500 dark:border-red-500',
                                    )}
                                />
                                <InputError message={errors.username} className="mt-1" />
                            </div>

                            {/* Email Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={3}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                    placeholder="email@example.com"
                                    className={cn(
                                        'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                        errors.email && 'border-red-500 dark:border-red-500',
                                    )}
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            {/* Password Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    disabled={processing}
                                    placeholder="Password"
                                    className={cn(
                                        'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                        errors.password && 'border-red-500 dark:border-red-500',
                                    )}
                                />
                                {/* Add Password Strength Indicator */}
                                {data.password && <PasswordStrengthIndicator password={data.password} />}
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            {/* Confirm Password Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation" className="text-gray-700 dark:text-gray-300">
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    disabled={processing}
                                    placeholder="Confirm password"
                                    className={cn(
                                        'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400',
                                        errors.password_confirmation && 'border-red-500 dark:border-red-500',
                                    )}
                                />
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                            {/* Avatar Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="avatar" className="text-gray-700 dark:text-gray-300">
                                    Profile Picture (Optional)
                                </Label>
                                <Input
                                    id="avatar"
                                    type="file"
                                    tabIndex={6}
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    disabled={processing}
                                    className="border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                />
                                <InputError message={errors.avatar} className="mt-1" />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                                tabIndex={7}
                                disabled={
                                    processing || !isPasswordStrong || !data.password_confirmation || data.password !== data.password_confirmation
                                } // Disable if processing, password weak, or passwords don't match
                            >
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                            <TextLink
                                href={route('login')}
                                tabIndex={8}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </form>
                </div>
            </div>
        </AuthLayout>
    );
}
