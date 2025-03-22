import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from '@inertiajs/react';

interface UserAvatarProps {
    user: {
        name: string;
        avatar?: string | null;
        username?: string;
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