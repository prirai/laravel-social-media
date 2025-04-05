import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title: string;
    description: string;
    [key: string]: any;
}

export default function AuthLayout({ children, title, description, ...props }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
