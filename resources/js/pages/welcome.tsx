import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
// NO import of next/image

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700&display=swap" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#121212] dark:text-[#EDEDEC]">
                {/* Header/Navbar */}
                <header className="sticky top-0 z-10 border-b border-[#19140035] bg-[#FDFDFC] py-4 dark:border-[#3E3E3A] dark:bg-[#121212]">
                    <nav className="container mx-auto flex items-center justify-between px-4 md:px-6">
                        <Link href="/" className="text-2xl font-semibold">
                            SimpleSocial
                        </Link>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-md bg-[#525252] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 dark:bg-[#52525B]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#27272A]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-md bg-[#525252] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Main Content */}
                <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 md:px-6 lg:flex-row lg:py-24">
                    {/* Text Content */}
                    <div className="mb-12 w-full max-w-lg space-y-6 text-center lg:mb-0 lg:w-1/2 lg:text-left">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Welcome to SimpleSocial</h1>
                        <p className="text-lg leading-relaxed text-[#706f6c] sm:text-xl dark:text-[#A1A09A]">
                            A safe space to connect with people known and unknown. Have fun but be civil!
                        </p>
                        <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                            {!auth.user && (
                                <>
                                    <Link
                                        href={route('register')}
                                        className="inline-block rounded-md bg-[#525252] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-gray-600"
                                    >
                                        Get Started
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="inline-block rounded-md px-6 py-3 text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#27272A]"
                                    >
                                        Log In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Image */}
                    <div className="relative w-full max-w-lg lg:w-1/2">
                        <img
                            src="/img/ss-v1.png"
                            alt="SimpleSocial Welcome Image"
                            className="rounded-lg object-cover"
                            // No width/height needed, let the CSS control it
                            // No priority needed, it's a regular img tag
                        />
                    </div>
                </main>

                {/* Footer (Optional) */}
                <footer className="bg-[#FDFDFC] py-6 text-center text-sm text-[#706f6c] dark:bg-[#121212] dark:text-[#A1A09A]">
                    &copy; {new Date().getFullYear()} SimpleSocial. All rights reserved.
                </footer>
            </div>
        </>
    );
}
