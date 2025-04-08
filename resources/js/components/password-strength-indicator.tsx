import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    password?: string; // Make password optional to handle initial empty state gracefully
    className?: string;
}

type Requirement = {
    id: string;
    regex: RegExp;
    text: string;
};

// Define updated password requirements
const requirements: Requirement[] = [
    { id: 'length', regex: /.{10,}/, text: 'At least 10 characters' }, // Updated length
    { id: 'lowercase', regex: /[a-z]/, text: 'One lowercase letter' },
    { id: 'uppercase', regex: /[A-Z]/, text: 'One uppercase letter' },
    { id: 'number', regex: /[0-9]/, text: 'One number' },
    { id: 'special', regex: /[^A-Za-z0-9]/, text: 'One special character' }, // Matches anything not alphanumeric
];

// Helper function to check all requirements
export const checkPasswordStrength = (password: string | undefined): boolean => {
    if (!password) return false;
    // Check if *all* requirements are met
    return requirements.every((req) => req.regex.test(password));
};

export default function PasswordStrengthIndicator({ password = '', className }: PasswordStrengthIndicatorProps) {
    return (
        <ul className={cn('mt-2 space-y-1 text-sm', className)}>
            {requirements.map((req) => {
                const isValid = req.regex.test(password);
                return (
                    <li
                        key={req.id}
                        className={cn(
                            'flex items-center gap-x-2 transition-colors duration-200',
                            isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400', // Keep unmet requirements visible
                        )}
                    >
                        {isValid ? (
                            <Check className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                            <X className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" /> // Use red X for clarity
                        )}
                        <span>{req.text}</span>
                    </li>
                );
            })}
        </ul>
    );
}
