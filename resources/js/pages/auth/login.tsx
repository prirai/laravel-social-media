import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth/auth-split-layout'; // Import the correct layout
import { cn } from '@/lib/utils';

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />
            <form className="flex flex-col gap-4" onSubmit={submit}>
                {' '}
                {/* Reduced gap */}
                <div className="grid gap-4">
                    {' '}
                    {/* Reduced gap */}
                    <div className="grid gap-1">
                        {' '}
                        {/* Reduced gap */}
                        <Label htmlFor="email">Email address</Label>
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
                            className={cn(errors.email && 'border-red-500')} // Conditional error styling
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-1">
                        {' '}
                        {/* Reduced gap */}
                        <div className="flex items-center justify-between">
                            {' '}
                            {/* Use justify-between */}
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-sm" tabIndex={5}>
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
                            className={cn(errors.password && 'border-red-500')} // Conditional error styling
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
                            className="mr-2" // Add margin for spacing
                        />
                        <Label htmlFor="remember" className="text-sm">
                            Remember me
                        </Label>{' '}
                        {/* Smaller text */}
                    </div>
                    <Button type="submit" className="mt-2 w-full" tabIndex={4} disabled={processing}>
                        {' '}
                        {/*Reduced margin*/}
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
                <div className="mt-2 text-center text-sm text-gray-300">
                    {' '}
                    {/* Reduced margin, lighter text */}
                    Don't have an account?{' '}
                    <TextLink href={route('register')} tabIndex={5} className="text-white">
                        Sign up
                    </TextLink>
                </div>
            </form>
            {status && <div className="mt-4 text-center text-sm font-medium text-green-400">{status}</div>} {/* Lighter green */}
        </AuthLayout>
    );
}
