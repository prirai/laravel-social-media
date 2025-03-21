import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react'; // Import useState

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

interface ProfileForm {
    name: string;
    username: string;
    email: string;
    avatar: string | null;
    new_avatar?: File | null;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(auth.user.avatar || null); // Add avatar preview state

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm<ProfileForm>({
        //Changed to ProfileForm
        name: auth.user.name,
        username: auth.user.username,
        email: auth.user.email,
        avatar: auth.user.avatar,
        new_avatar: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name); // Make sure to append name
        formData.append('username', data.username); // Make sure to append username
        formData.append('email', data.email); // Make sure to append email
        if (data.new_avatar) {
            formData.append('new_avatar', data.new_avatar);
        }

        post(route('profile.update'), {
            data: formData,
            preserveScroll: true,
            // onSuccess: () => {},
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('new_avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setData('new_avatar', null);
            setAvatarPreview(auth.user.avatar || null); // Reset to original avatar or null
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your name, username, email address, and profile picture." />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="avatar">Profile Picture</Label>
                            <div className="flex items-center gap-4">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="h-16 w-16 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                                        {data.name.charAt(0)}
                                    </div>
                                )}
                                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('avatar')?.click()} // Trigger file input
                                >
                                    Change Picture
                                </Button>
                            </div>
                            <InputError className="mt-2" message={errors.new_avatar} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                className="mt-1 block w-full"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Username"
                            />
                            <InputError className="mt-2" message={errors.username} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
