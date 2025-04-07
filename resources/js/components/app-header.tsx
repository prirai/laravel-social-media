import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from "react";
import UserAvatar from '@/components/user-avatar';
import axios from 'axios';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Bell,
    LogOut,
    Moon,
    Search,
    Settings,
    Sun,
    User,
    X,
    LayoutGrid,
    ShoppingBag,
    Mail,
    Home,
    Computer,
    Link as Chain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Input } from "@/components/ui/input";
import AppLogo from "@/components/app-logo";
import { Breadcrumbs } from "./breadcrumbs";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications } from '@/contexts/NotificationContext';
import { type BreadcrumbItem as TypesBreadcrumbItem } from '@/types';
import { type SharedData, type Auth } from '@/types';

dayjs.extend(relativeTime);

// Define needed types
interface NavItem {
    title: string;
    url: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface Notification {
    id: number;
    type: string;
    data: unknown;
    read_at: string | null;
    created_at: string;
    route: string;
    from_user?: {
        id: number;
        name: string;
        username: string;
        avatar: string | null;
        verification_status?: 'unverified' | 'pending' | 'verified';
    };
}

const mainNavItems: NavItem[] = [
    {
        title: 'Homepage',
        url: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Marketplace',
        url: route('marketplace.index'),
        icon: ShoppingBag,
    },
    {
        title: 'Messages',
        url: route('messages.index'),
        icon: Mail,
    },
    {
        title: 'Blockchain',
        url: route('blockchain.index'),
        icon: Chain,
    },
];
// Navigation and UI elements
// Define active item styles once to use in both desktop and mobile
const activeItemStyles = "text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-300";
const inactiveItemStyles = "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100";
const activeIconStyles = "text-blue-600 dark:text-blue-300";
const inactiveIconStyles = "text-gray-500 dark:text-gray-400";

interface AppHeaderProps {
    breadcrumbs?: TypesBreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props as unknown as { auth: Auth };
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; username: string; avatar: string | null }>>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [, setSystemPrefersDark] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const mobileNotificationsRef = useRef<HTMLDivElement>(null);

    // Get notification state and methods from context
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        isLoadingNotifications
    } = useNotifications();

    useEffect(() => {
        const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setSystemPrefersDark(prefersDark);

        if (localTheme) {
            setTheme(localTheme);
        } else {
            if (prefersDark) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        }

        // Setup listener for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            }
        }
    }, [theme]);

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            const fetchUsers = async () => {
                try {
                    const response = await axios.get(route('users.search'), {
                        params: { query: searchQuery }
                    });
                    setSearchResults(response.data.users);
                    setShowSearchResults(true);
                } catch (error) {
                    console.error('Error searching users:', error);
                }
            };
            fetchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isClickInsideDesktopNotifications = notificationsRef.current && notificationsRef.current.contains(event.target as Node);
            const isClickInsideMobileNotifications = mobileNotificationsRef.current && mobileNotificationsRef.current.contains(event.target as Node);

            if (!isClickInsideDesktopNotifications && !isClickInsideMobileNotifications) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (auth.user) {
            fetchUnreadCount();
        }
    }, [auth.user, fetchUnreadCount]);

    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('system');
        } else {
            setTheme('dark');
        }
    };

    // Add an effect to automatically mark notifications as read when they are displayed
    useEffect(() => {
        if (showNotifications && notifications.length > 0) {
            // After a delay, mark all unread notifications as read when they're visible
            const timer = setTimeout(() => {
                const unreadNotifications = notifications.filter(n => !n.read_at);
                if (unreadNotifications.length > 0) {
                    markAllAsRead();
                }
            }, 3000); // Give users 3 seconds to see which ones are unread

            return () => clearTimeout(timer);
        }
    }, [showNotifications, notifications, markAllAsRead]);

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read if not already read
        if (!notification.read_at) {
            markAsRead(notification.id);
        }

        // Navigate to the notification route
        if (notification.route) {
            setShowNotifications(false);
            window.location.href = notification.route;
        }
    };

    return (
        <>
            {/* Main Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
                <div className="mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-6 lg:px-8">
                    {/* Logo and main navigation - add spacing between logo and nav items */}
                    <div className="flex items-center gap-6 lg:gap-8">
                        <Link href="/" className="flex items-center">
                            <AppLogo className="h-8 w-auto" />
                            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                                SimpleSocial
                            </span>
                        </Link>

                        {/* Add proper spacing between logo and navigation */}
                        <div className="hidden items-center gap-2 lg:flex">
                            {mainNavItems.map((item) => {
                                // Compare the current route path with the item URL's path, not the raw URL string
                                const currentPath = window.location.pathname;
                                // Extract just the path part from the URL (which might be a full URL from route())
                                let itemPath = typeof item.url === 'string' ? item.url : item.url;
                                
                                // If it's a full URL (from route()), extract just the path
                                if (itemPath.startsWith('http')) {
                                    try {
                                        itemPath = new URL(itemPath).pathname;
                                    } catch (e) {
                                        console.error('Error parsing URL:', itemPath, e);
                                    }
                                }
                                
                                // For debugging
                                console.log(`Item: ${item.title}, Current Path: ${currentPath}, Item Path: ${itemPath}`);
                                
                                const isActive = currentPath === itemPath || 
                                                currentPath.startsWith(itemPath) || 
                                                (item.title === 'Homepage' && currentPath === '/dashboard') ||
                                                (item.title === 'Marketplace' && currentPath.includes('marketplace')) ||
                                                (item.title === 'Messages' && currentPath.includes('messages'));
                                
                                return (
                                    <Link
                                        key={item.title}
                                        href={item.url}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                                            isActive
                                                ? activeItemStyles
                                                : inactiveItemStyles
                                        )}
                                    >
                                        {item.icon && (
                                            <Icon
                                                iconNode={item.icon}
                                                className={cn(
                                                    "h-5 w-5",
                                                    isActive ? activeIconStyles : inactiveIconStyles
                                                )}
                                            />
                                        )}
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right side actions - add consistent spacing */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Search button - Make visible on all screen sizes */}
                        <div className="relative" ref={searchRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg"
                                onClick={() => {
                                    setShowSearchResults(!showSearchResults);
                                    if (showSearchResults) {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }
                                }}
                            >
                                <Search className={cn(
                                    "h-5 w-5",
                                    inactiveIconStyles
                                )} />
                                <span className="sr-only">Search</span>
                            </Button>

                            {/* Unified search dropdown - centered on mobile, right-aligned on desktop */}
                            {showSearchResults && (
                                <div className={`absolute z-50 mt-2 w-80 max-w-[90vw] rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${
                                    window.innerWidth < 640
                                        ? 'left-1/2 -translate-x-1/2 right-auto'
                                        : 'right-0 top-full'
                                }`}>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Search Users</h3>
                                        <Input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="mb-2 rounded-lg"
                                            autoFocus
                                        />
                                        <div className="max-h-96 space-y-1 overflow-y-auto">
                                            {searchResults.map((user) => (
                                                <Link
                                                    key={user.id}
                                                    href={route('profile.show', user.username)}
                                                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onClick={() => {
                                                        setShowSearchResults(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <UserAvatar user={user} className="size-8" />
                                                    <div>
                                                        <p className="font-medium text-sm">{user.name}</p>
                                                        <p className="text-xs text-gray-500">@{user.username}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                                            <div className="p-2 text-center text-sm text-gray-500">
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons with consistent spacing */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Notifications Button */}
                            <div className="relative md:block" ref={notificationsRef}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-lg"
                                    onClick={() => {
                                        setShowNotifications(!showNotifications);
                                        if (!showNotifications) {
                                            fetchNotifications();
                                        }
                                    }}
                                >
                                    <Bell className={cn(
                                        "h-5 w-5",
                                        window.location.pathname.startsWith('/notifications') ? activeIconStyles : inactiveIconStyles
                                    )} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    <span className="sr-only">Notifications</span>
                                </Button>
                                {showNotifications && (
                                    <>
                                        {/* Mobile backdrop - ensure it covers the entire screen */}
                                        <div 
                                            className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black/30 z-[95] md:hidden"
                                            onClick={() => setShowNotifications(false)}
                                        ></div>
                                        {/* Notification panel */}
                                        <div className="fixed md:absolute top-[80px] md:top-full left-1/2 -translate-x-1/2 md:translate-y-0 md:left-auto md:right-0 md:translate-x-0 z-[100] w-[90%] md:w-80 max-w-[400px] max-h-[70vh] overflow-auto rounded-xl border bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                                            <div className="flex items-center justify-between border-b pb-2 mb-2">
                                                <h3 className="font-semibold">Notifications</h3>
                                                <div className="flex gap-2">
                                                    {unreadCount > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-lg text-xs"
                                                            onClick={markAllAsRead}
                                                        >
                                                            Mark all as read
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-lg"
                                                        onClick={() => setShowNotifications(false)}
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {isLoadingNotifications ? (
                                                <div className="mt-4 flex items-center justify-center py-4">
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                <div className="mt-2 max-h-80 overflow-y-auto">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            onClick={() => handleNotificationClick(notification)}
                                                            className={cn(
                                                                "cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                                                                !notification.read_at && "bg-blue-50 dark:bg-blue-900/20"
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {notification.from_user && (
                                                                    <UserAvatar user={notification.from_user} className="size-10" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="text-sm">
                                                                        {notification.type === 'friend_request' && (
                                                                            <span>
                                                                                <span className="font-medium">{notification.from_user?.name}</span> sent you a friend request
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        {dayjs(notification.created_at).fromNow()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-4 text-center text-sm text-gray-500 py-8">
                                                    No notifications yet
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg md:flex"
                                onClick={toggleTheme}
                            >
                                <div className="relative h-5 w-5">
                                    <Sun className={`h-5 w-5 transition-all ${theme === 'light' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} />
                                    <Moon className={`absolute inset-0 h-5 w-5 transition-all ${theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
                                    <Computer className={`absolute inset-0 h-5 w-5 transition-all ${theme === 'system' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
                                </div>
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar
                                                user={auth.user}
                                                className="h-8 w-8 ring-2 ring-blue-500/20 dark:ring-blue-500/30"
                                            />
                                            <span className="hidden text-sm font-medium lg:inline-block">
                                                {auth.user?.name}
                                            </span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{auth.user?.name}</p>
                                            <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                                                {auth.user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link href={`/profile/${auth.user?.username}`}>
                                        <DropdownMenuItem>
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href="/settings">
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={route('logout')} method="post" className="flex w-full items-center">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile bottom navigation - improved styling */}
            <div className="lg:hidden">
                <div className="fixed bottom-0 left-0 right-0 z-[100] flex h-[60px] items-center justify-around border-t border-gray-200 bg-white/95 px-2 py-2 backdrop-blur-md shadow-lg dark:border-gray-800 dark:bg-gray-950/95">
                    <Link
                        href={route('dashboard')}
                        className={cn(
                            "flex flex-col items-center gap-0.5 rounded-full p-2",
                            window.location.pathname === '/dashboard' || window.location.pathname === '/' || window.location.pathname.startsWith('/dashboard')
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <Home className="h-6 w-6" />
                        <span className="text-[10px]">Home</span>
                    </Link>

                    {/* Marketplace */}
                    <Link
                        href={route('marketplace.index')}
                        className={cn(
                            "flex flex-col items-center gap-0.5 rounded-full p-2",
                            window.location.pathname.includes('marketplace')
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <ShoppingBag className="h-6 w-6" />
                        <span className="text-[10px]">Market</span>
                    </Link>

                    {/* Messages */}
                    <Link
                        href={route('messages.index')}
                        className={cn(
                            "flex flex-col items-center gap-0.5 rounded-full p-2",
                            window.location.pathname.includes('messages')
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <Mail className="h-6 w-6" />
                        <span className="text-[10px]">Messages</span>
                    </Link>

                    {/* Blockchain */}
                    <Link
                        href={route('blockchain.index')}
                        className={cn(
                            "flex flex-col items-center gap-0.5 rounded-full p-2",
                            window.location.pathname.includes('blockchain')
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <Chain className="h-6 w-6" />
                        <span className="text-[10px]">Chain</span>
                    </Link>
                </div>
            </div>

            {/* Breadcrumbs bar */}
            {breadcrumbs.length > 1 && (
                <div className="fixed top-16 left-0 right-0 z-40 flex w-full border-b border-gray-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 shadow-sm dark:border-gray-800 dark:from-gray-900/80 dark:to-blue-950/30 md:top-20">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}

            {/* Add padding to the main content to account for fixed elements */}
            <div className="lg:pb-0">
                <div className={`${breadcrumbs.length > 1 ? 'pt-28 md:pt-32' : 'pt-16 md:pt-20'}`} />
            </div>
        </>
    );
}
