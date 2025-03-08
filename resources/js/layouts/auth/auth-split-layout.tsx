import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-950" />
                ```
                <Link href={route('home')} className="relative z-20 flex items-center text-lg font-medium">
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
                    {name}
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">&ldquo;{quote.message}&rdquo;</p>
                            <footer className="text-sm text-neutral-300">{quote.author}</footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="relative flex w-full items-center justify-center bg-zinc-900/20 backdrop-blur-sm lg:p-8">
                {/* Glassmorphism Background */}
                <div
                    className="absolute inset-0" // Minimalist approach
                />

                {/* Card-like structure */}
                <div className="relative z-10 w-full max-w-md rounded-lg bg-black/70 p-6 text-white shadow-lg backdrop-blur-md sm:p-8 lg:p-12">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6">
                        <Link href={route('home')} className="relative z-20 flex items-center justify-center lg:hidden">
                            <AppLogoIcon className="h-10 fill-current text-white sm:h-12" />
                        </Link>
                        <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                            <h1 className="text-2xl font-semibold">{title}</h1> {/* Increased font size and weight */}
                            <p className="text-sm text-balance text-gray-300">{description}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
