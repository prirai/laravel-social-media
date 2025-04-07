import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface FileSizeWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: string[];
}

export function FileSizeWarningDialog({ open, onOpenChange, files }: FileSizeWarningDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>File Size Limit Exceeded</DialogTitle>
                    <DialogDescription>
                        The following files exceed the 5MB size limit and will not be uploaded:
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-2">
                    {files.map((fileName, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>{fileName}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 