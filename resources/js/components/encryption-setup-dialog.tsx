import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateKeyPair, savePrivateKeyToFile, savePrivateKey, hasPrivateKey, isValidPrivateKey } from '@/utils/crypto';
import { AlertCircle, ArrowDownCircle, Info, Key, Shield } from 'lucide-react';
import axios from 'axios';

interface EncryptionSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetupComplete: () => void;
}

export function EncryptionSetupDialog({ open, onOpenChange, onSetupComplete }: EncryptionSetupDialogProps) {
  const [tab, setTab] = useState<'generate' | 'upload'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyError, setPrivateKeyError] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [showKeyDownloadInfo, setShowKeyDownloadInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if private key is already in session storage
  useEffect(() => {
    if (hasPrivateKey()) {
      setSetupComplete(true);
      onSetupComplete();
    }
  }, [onSetupComplete]);

  const handleGenerateKeys = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      
      // Generate new key pair
      const { publicKey, privateKey } = await generateKeyPair();

      // Get current username for the filename
      let username = '';
      if (window.__page?.props?.auth?.user?.username) {
        username = window.__page.props.auth.user.username;
      }

      // Save private key as a file for the user to backup
      await savePrivateKeyToFile(privateKey, username);
      setShowKeyDownloadInfo(true);

      // Store in session storage for encryption operations
      const saveResult = savePrivateKey(privateKey);
      
      if (!saveResult) {
        throw new Error('Failed to save private key to session storage');
      }

      // Submit public key to server
      try {
        const response = await axios.post(route('user.update-public-key'), {
          public_key: publicKey
        });

        if (response.data.success) {
          // Small delay to let the user see the download info
          setTimeout(() => {
            setSetupComplete(true);
            onSetupComplete();
          }, 2000);
        } else {
          throw new Error('Server rejected public key upload');
        }
      } catch (err: any) {
        setErrorMessage(`Failed to upload public key: ${err.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      setErrorMessage(`An unexpected error occurred during encryption setup: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadPrivateKey = async () => {
    if (!privateKey.trim()) {
      setPrivateKeyError('Please enter your private key');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      // Validate if the entered key is a valid RSA private key
      if (!isValidPrivateKey(privateKey)) {
        setPrivateKeyError('Invalid private key format');
        return;
      }

      // Store the private key in session storage
      const saveResult = savePrivateKey(privateKey);
      
      if (!saveResult) {
        throw new Error('Failed to save private key to session storage');
      }

      setSetupComplete(true);
      onSetupComplete();
    } catch (error: any) {
      setPrivateKeyError(`Error processing private key: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // If setup is already complete, don't show the dialog but notify parent
  if (setupComplete) {
    return null;
  }

  // If not open, return null
  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true} defaultOpen={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            End-to-End Encryption Setup
          </DialogTitle>
          <DialogDescription>
            Set up encryption for secure private messages that only you and your recipient can read.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Alert className="mb-4 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>One-time setup:</strong> Messages will be encrypted using public key cryptography.
              Your private key will never be stored on our servers and is only used on your device.
            </AlertDescription>
          </Alert>

          {showKeyDownloadInfo && (
            <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300">
              <ArrowDownCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Private key downloaded!</strong> Please save this file securely - you'll need it to decrypt messages and it cannot be recovered if lost.
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert className="mb-4 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="generate" value={tab} onValueChange={(value) => setTab(value as 'generate' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate New Keys</TabsTrigger>
              <TabsTrigger value="upload">Use Existing Key</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generate a new encryption key pair. Your private key will be downloaded
                  automatically - <strong>keep it secure</strong> as it won't be stored on our servers.
                </p>

                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                      <Key className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">New Encryption Keys</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Public key is stored on server, private key stays on your device
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateKeys}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating Keys...' : 'Generate and Download Keys'}
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  If you already have a private key from a previous setup, paste it below.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="privateKey">Your Private Key</Label>
                  <Textarea
                    id="privateKey"
                    value={privateKey}
                    onChange={(e) => {
                      setPrivateKey(e.target.value);
                      setPrivateKeyError('');
                    }}
                    placeholder="Paste your private key here (begins with -----BEGIN RSA PRIVATE KEY-----)"
                    className="font-mono text-xs h-40"
                    rows={5}
                  />
                  {privateKeyError && (
                    <p className="text-sm text-red-500">{privateKeyError}</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleUploadPrivateKey}
                disabled={isUploading || !privateKey.trim()}
                className="w-full"
              >
                {isUploading ? 'Processing...' : 'Use This Private Key'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Important Security Note</h4>
                <p className="mt-1 text-xs">
                  Your private key is the only way to decrypt messages sent to you. If you lose it, you won't be able to read encrypted messages. Store it securely and consider backing it up in a password manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
