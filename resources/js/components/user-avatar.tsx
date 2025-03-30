import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from '@inertiajs/react';
import { ExclamationCircleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface UserAvatarProps {
    user: {
        name: string;
        avatar?: string | null;
        username?: string;
        verification_status?: 'unverified' | 'pending' | 'verified';
    };
    className?: string;
    linkable?: boolean;
}

export function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

export default function UserAvatar({ user, className = "size-8", linkable = true }: UserAvatarProps) {
    const AvatarComponent = (
        <div className="relative">
            <Avatar className={`overflow-hidden ${className}`}>
                <AvatarImage
                    src={
                        user.avatar && user.avatar.startsWith('avatars/')
                            ? `/storage/${user.avatar}`
                            : user.avatar || undefined
                    }
                    alt={user.name}
                    className="object-cover w-full h-full"
                />
                <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            
            {user.verification_status === 'unverified' && (
                <span className="absolute bottom-0 right-0 text-amber-500 drop-shadow-sm">
                    <ExclamationCircleIcon className="h-2.5 w-2.5" />
                </span>
            )}
            {user.verification_status === 'pending' && (
                <span className="absolute bottom-0 right-0 text-blue-500 drop-shadow-sm">
                    <ClockIcon className="h-2.5 w-2.5" />
                </span>
            )}
            {user.verification_status === 'verified' && (
                <span className="absolute bottom-0 right-0 text-green-500 drop-shadow-sm">
                    <CheckCircleIcon className="h-2.5 w-2.5" />
                </span>
            )}
        </div>
    );

    if (linkable && user.username) {
        return (
            <Link href={route('profile.show', user.username)} className="hover:opacity-80">
                {AvatarComponent}
            </Link>
        );
    }

    return AvatarComponent;
} 