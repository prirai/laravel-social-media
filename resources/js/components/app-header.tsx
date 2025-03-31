import { Link, usePage, router } from '@inertiajs/react';
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
    Menu,
    MessageSquare,
    Moon,
    Search,
    Settings,
    Sun,
    User,
    X,
    LayoutGrid,
    ShoppingBag,
    Mail,
    Heart as HeartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Input } from "@/components/ui/input";
import AppLogo from "@/components/app-logo";
import { Breadcrumbs } from "./breadcrumbs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Define needed types
interface NavItem {
    title: string;
    url: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface BreadcrumbItem {
    title: string;
    url: string;
    href: string;
}

interface SharedData {
    props: {
        auth: {
            user: {
                id: number;
                name: string;
                email: string;
                avatar?: string;
            } | null;
        };
    };
    url: string;
    [key: string]: any; // Add index signature for PageProps compatibility
}

interface Notification {
    id: number;
    type: string;
    data: any;
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
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Marketplace',
        url: '/marketplace',
        icon: ShoppingBag,
    },
    {
        title: 'Messages',
        url: '/messages',
        icon: Mail,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Notifications',
        url: '/notifications',
        icon: Bell,
    },
];

// Navigation and UI elements
// Define active item styles once to use in both desktop and mobile
const activeItemStyles = "text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-300";
const inactiveItemStyles = "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100";
const activeIconStyles = "text-blue-600 dark:text-blue-300";
const inactiveIconStyles = "text-gray-500 dark:text-gray-400";

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; username: string; avatar: string | null }>>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const mobileNotificationsRef = useRef<HTMLDivElement>(null);
    
    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    useEffect(() => {
        const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (localTheme) {
            setTheme(localTheme);
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        }
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
        const searchUsers = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

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

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get(route('notifications.unread-count'));
                setUnreadCount(response.data.unread_count);
            } catch (error) {
                console.error('Error fetching notification count:', error);
            }
        };
        
        if (auth.user) {
            fetchUnreadCount();
            
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [auth.user]);

    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('system');
        } else {
            setTheme('dark');
        }
    };

    const fetchNotifications = async () => {
        if (isLoadingNotifications) return;
        
        setIsLoadingNotifications(true);
        try {
            const response = await axios.get(route('notifications.index'));
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };
    
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already read
        if (!notification.read_at) {
            try {
                await axios.post(route('notifications.read', notification.id));
                // Update the local state to mark as read
                setNotifications(prevNotifications => 
                    prevNotifications.map(n => 
                        n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        
        // Navigate to the notification route
        if (notification.route) {
            setShowNotifications(false);
            window.location.href = notification.route;
        }
    };
    
    const markAllAsRead = async () => {
        try {
            await axios.post(route('notifications.mark-all-read'));
            // Update local state
            setNotifications(prevNotifications => 
                prevNotifications.map(n => ({ ...n, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <>
            {/* Main Header */}
            <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
                <div className="mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:max-w-7xl">
                    {/* Logo and brand */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" prefetch className="flex items-center gap-2">
                            <AppLogo />
                            <span className="text-lg font-semibold tracking-tight hidden sm:inline-block">SimpleSocial</span>
                                                    </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-1 lg:flex">
                        {mainNavItems.map((item) => {
                            const isActive = page.url === item.url;
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

                    {/* Search */}
                    <div className="hidden flex-1 md:flex md:max-w-xs lg:max-w-md xl:max-w-lg">
                            <div className="relative" ref={searchRef}>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                className="group h-10 w-10 rounded-xl"
                                    onClick={() => setShowSearchResults(!showSearchResults)}
                                >
                                <Search className="size-5 opacity-80 group-hover:opacity-100" />
                                </Button>
                                {showSearchResults && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
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
                                                    href={`/profile/${user.username}`}
                                                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onClick={() => {
                                                        setShowSearchResults(false);
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                    }}
                                                >
                                                <UserAvatar user={user} className="size-8" />
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                            {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                                                <div className="p-2 text-center text-sm text-gray-500">
                                                    No users found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>

                    {/* Actions and User */}
                    <div className="flex items-center gap-2">
                        {/* Notifications Button - Desktop */}
                        <div className="relative hidden md:block" ref={notificationsRef}>
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
                                    page.url === "/notifications" ? activeIconStyles : inactiveIconStyles
                                )} />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                                <span className="sr-only">Notifications</span>
                                                        </Button>
                                            {showNotifications && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                    <div className="flex items-center justify-between">
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
                            )}
                        </div>

                        {/* Messages Button */}
                                                    <Link
                            href="/messages"
                            className={cn(
                                "hidden items-center justify-center rounded-lg p-2 md:flex",
                                page.url === "/messages"
                                    ? activeItemStyles
                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            )}
                        >
                            <MessageSquare
                                className={cn(
                                    "h-5 w-5",
                                    page.url === "/messages" ? activeIconStyles : inactiveIconStyles
                                )}
                            />
                            <span className="sr-only">Messages</span>
                        </Link>

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden rounded-lg md:flex"
                            onClick={toggleTheme}
                        >
                            <div className="relative h-5 w-5">
                                <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                                <Moon className="absolute inset-0 h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                            </div>
                                                <span className="sr-only">Toggle theme</span>
                                            </Button>

                        {/* Mobile Search Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg md:hidden"
                            onClick={() => setShowSearchResults(!showSearchResults)}
                        >
                            <Search className="h-5 w-5" />
                            <span className="sr-only">Search</span>
                        </Button>
                        {showSearchResults && (
                            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 md:hidden">
                                <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-semibold">Search</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-lg"
                                            onClick={() => {
                                                setShowSearchResults(false);
                                                setSearchQuery('');
                                                setSearchResults([]);
                                            }}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-4 rounded-lg"
                                        autoFocus
                                    />
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <Link
                                                key={user.id}
                                                href={`/profile/${user.username}`}
                                                className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => {
                                                    setShowSearchResults(false);
                                                    setSearchQuery('');
                                                    setSearchResults([]);
                                                }}
                                            >
                                                <UserAvatar user={user} className="size-10" />
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                                </div>
                                            </Link>
                                        ))}
                                        {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mobile Notifications Button */}
                        <div className="relative md:hidden" ref={mobileNotificationsRef}>
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
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                                <span className="sr-only">Notifications</span>
                            </Button>
                            {showNotifications && (
                                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20">
                                    <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                        <div className="mb-4 flex items-center justify-between">
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
                                            <div className="flex items-center justify-center py-8">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            <div className="max-h-[60vh] overflow-y-auto">
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
                                            <div className="text-center text-sm text-gray-500 py-8">
                                                No notifications yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg md:hidden"
                            onClick={toggleTheme}
                        >
                            <div className="relative h-5 w-5">
                                <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                                <Moon className="absolute inset-0 h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                            </div>
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* User Profile Dropdown */}
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
                                <Link href={`/profile/${auth.user?.id}`}>
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

            {/* Mobile bottom navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 block border-t border-gray-200 bg-white bg-gradient-to-t from-white via-white to-gray-50 px-2 py-3 shadow-lg dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 lg:hidden">
                <div className="mx-auto flex items-center justify-around">
                    {mainNavItems.map((item) => {
                        const isActive = page.url === item.url;
                        return (
                            <Link
                                key={item.title}
                                href={item.url}
                                className={cn(
                                    "flex flex-col items-center justify-center rounded-xl px-3 py-2 text-center",
                                    isActive ? activeItemStyles : inactiveItemStyles
                                )}
                            >
                                {item.icon && (
                                    <Icon 
                                        iconNode={item.icon} 
                                        className={cn(
                                            "h-6 w-6 mb-1",
                                            isActive ? activeIconStyles : inactiveIconStyles
                                        )}
                                    />
                                )}
                                <span className="text-xs font-medium">{item.title}</span>
                            </Link>
                        );
                    })}
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
            <div className="pb-20 lg:pb-0">
                <div className={`${breadcrumbs.length > 1 ? 'pt-28 md:pt-32' : 'pt-16 md:pt-20'}`} />
            </div>
        </>
    );
}
