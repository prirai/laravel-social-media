import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define the interface for a notification
export interface Notification {
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

// Define the shape of the context
interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isLoadingNotifications: boolean;
}

// Create the context with a default value
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

// Helper function to check if current page is an auth page
const isAuthPage = (): boolean => {
    return document.body.classList.contains('auth-page');
};

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    // Fetch unread count on component mount
    useEffect(() => {
        // Skip on auth pages
        if (!isAuthPage()) {
            fetchUnreadCount();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(() => {
                // Only fetch if not on auth page
                if (!isAuthPage()) {
                    fetchUnreadCount();
                }
            }, 30000);

            return () => clearInterval(interval);
        }
    }, []);

    const fetchUnreadCount = async () => {
        // Skip on auth pages or if user is likely not authenticated
        if (isAuthPage()) {
            return;
        }

        try {
            const response = await axios.get('/notifications/unread-count');
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            // Only log error in development mode
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching notification count:', error);
            }

            // Handle specific error cases
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                // User is not authenticated, quietly ignore
                setUnreadCount(0);
            }
        }
    };

    const fetchNotifications = async () => {
        // Skip on auth pages or if already loading
        if (isAuthPage() || isLoadingNotifications) {
            return;
        }

        setIsLoadingNotifications(true);
        try {
            const response = await axios.get('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            // Only log error in development mode
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching notifications:', error);
            }

            // Handle specific error cases
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                // User is not authenticated, reset state
                setNotifications([]);
                setUnreadCount(0);
            }
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const markAsRead = async (notificationId: number) => {
        // Skip on auth pages
        if (isAuthPage()) {
            return;
        }

        try {
            await axios.post(`/notifications/${notificationId}/read`);
            // Update the local state to mark as read
            setNotifications(prevNotifications =>
                prevNotifications.map(n =>
                    n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            // Only log error in development mode
            if (process.env.NODE_ENV === 'development') {
                console.error('Error marking notification as read:', error);
            }
        }
    };

    const markAllAsRead = async () => {
        // Skip on auth pages
        if (isAuthPage()) {
            return;
        }

        try {
            await axios.post('/notifications/mark-all-read');
            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(n => ({ ...n, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            // Only log error in development mode
            if (process.env.NODE_ENV === 'development') {
                console.error('Error marking all notifications as read:', error);
            }
        }
    };

    const value = {
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        isLoadingNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook for using the context
function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export { NotificationProvider, useNotifications };
