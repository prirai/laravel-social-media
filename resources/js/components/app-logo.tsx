import AppLogoIcon from './app-logo-icon';
import { cn } from '@/lib/utils';

interface AppLogoProps {
    className?: string;
}

export default function AppLogo({ className }: AppLogoProps) {
    return (
        <div className={cn("bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md", className)}>
            <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
        </div>
    );
}
