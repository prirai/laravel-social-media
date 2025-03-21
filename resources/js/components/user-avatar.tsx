import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
    user: {
        name: string;
        avatar?: string | null;
    };
    className?: string;
}

export function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

export default function UserAvatar({ user, className = "size-8" }: UserAvatarProps) {
    return (
        <Avatar className={`overflow-hidden rounded-full ${className}`}>
            <AvatarImage
                src={
                    user.avatar && user.avatar.startsWith('avatars/')
                        ? `/storage/${user.avatar}`
                        : user.avatar || undefined
                }
                alt={user.name}
            />
            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                {getInitials(user.name)}
            </AvatarFallback>
        </Avatar>
    );
} 