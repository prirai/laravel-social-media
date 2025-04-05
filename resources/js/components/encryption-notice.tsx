import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface EncryptionNoticeProps {
  className?: string;
}

export function EncryptionNotice({ className }: EncryptionNoticeProps) {
  // Use local storage to remember if the user has dismissed this notice
  const [isDismissed, setIsDismissed] = useLocalStorage('encryption-notice-dismissed', false);
  
  if (isDismissed) {
    return null;
  }
  
  return (
    <Alert 
      className={`relative bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 
                dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800 ${className}`}
    >
      <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-700 dark:text-blue-300">End-to-End Encryption Available</AlertTitle>
      <AlertDescription className="text-blue-600 dark:text-blue-400">
        <p className="mt-1 text-sm">
          Your private messages can now be protected with end-to-end encryption. 
          Look for the <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <Lock className="mr-1 h-3 w-3" /> E2E
          </span> badge on messages.
        </p>
        <p className="mt-2 text-sm">
          To use encryption, toggle the lock button in any one-to-one conversation. 
          You'll be prompted to set up your encryption keys if you haven't already.
        </p>
      </AlertDescription>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-2 top-2 h-6 w-6 rounded-full text-blue-500 hover:bg-blue-100 hover:text-blue-600 
                   dark:text-blue-400 dark:hover:bg-blue-900 dark:hover:text-blue-300"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  );
} 