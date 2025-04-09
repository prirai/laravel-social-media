import forge from 'node-forge';
import { saveAs } from 'file-saver';
import axios from 'axios';

// Add TypeScript declaration for Inertia page
declare global {
  interface Window {
    __page: {
      props: {
        auth: {
          user: {
            id: number;
            name: string;
            username: string;
            email: string;
            avatar?: string | null;
          } | null;
        }
      }
    }
    __authStateListenerSetup?: boolean;
  }
}

// Session storage key
const SESSION_STORAGE_KEY = 'pki_private_key';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Check if user is authenticated by checking window.__page
 */
export const isAuthenticated = (): boolean => {
  try {
    return !!window.__page?.props?.auth?.user;
  } catch (error) {
    return false;
  }
};

/**
 * Check if current page is an auth page
 */
export const isAuthPage = (): boolean => {
  return document.body.classList.contains('auth-page');
};

/**
 * Generate a new RSA key pair for encryption
 */
export const generateKeyPair = async (): Promise<KeyPair> => {
  return new Promise((resolve, reject) => {
    try {
      // Generate a key pair with 2048 bits
      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

      // Convert keys to PEM format
      const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
      const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

      resolve({ publicKey, privateKey });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Save the private key to a text file for backup
 */
export const savePrivateKeyToFile = (privateKey: string, username?: string) => {
  // Get current timestamp in YYYYMMDDHHMMSS format
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  // Default filename if no username is provided
  let filename = `user_secure_msg_privkey_${timestamp}.txt`;

  try {
    // Try to get username from provided parameter
    if (username && username.trim() !== '') {
      filename = `${username}_secure_msg_privkey_${timestamp}.txt`;
    }
    // If no username provided, try to get from window.__page
    else if (isAuthenticated() && window.__page?.props?.auth?.user?.username) {
      const authUsername = window.__page.props.auth.user.username;
      filename = `${authUsername}_secure_msg_privkey_${timestamp}.txt`;
    }
  } catch (error) {
    // Fall back to default filename with timestamp
  }

  const blob = new Blob([privateKey], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
};

/**
 * Save the private key in session storage, tied to the authenticated session
 * Session storage is cleared when the browser is closed, providing better
 * security than persistent cookies while maintaining session availability
 */
export const savePrivateKey = (privateKey: string): boolean => {
  try {
    if (!privateKey) {
      return false;
    }
    
    // Store in session storage - this will be automatically cleared when browser is closed
    sessionStorage.setItem(SESSION_STORAGE_KEY, privateKey);
    
    // Also set a flag to track that we've saved a key
    sessionStorage.setItem('has_private_key', 'true');
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get the private key from session storage
 */
export const getPrivateKey = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

/**
 * Remove the private key from session storage
 */
export const clearPrivateKey = (): boolean => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a private key is currently available
 */
export const hasPrivateKey = (): boolean => {
  return sessionStorage.getItem('has_private_key') === 'true' && !!getPrivateKey();
};

/**
 * Encrypt a message using the recipient's public key
 */
export const encryptMessage = (message: string, publicKeyPem: string): string => {
  try {
    // Convert PEM to public key
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // Use RSA-OAEP for encryption with SHA-256 for padding
    const encrypted = publicKey.encrypt(forge.util.encodeUtf8(message), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });

    // Return base64 encoded string
    return forge.util.encode64(encrypted);
  } catch (error) {
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt a message using the user's private key
 */
export const decryptMessage = (encryptedMessage: string, privateKeyPem: string): string => {
  try {
    // Convert PEM to private key
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    // Decode the base64 message
    const encryptedBytes = forge.util.decode64(encryptedMessage);

    // Decrypt using RSA-OAEP with SHA-256
    const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });

    // Return decoded UTF-8 string
    return forge.util.decodeUtf8(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Validate if a string is a valid private key
 */
export const isValidPrivateKey = (key: string): boolean => {
  try {
    forge.pki.privateKeyFromPem(key);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Setup listener for auth state changes
 * This automatically cleans up encryption keys when the user logs out
 */
export const setupAuthStateListener = (): void => {
  // Only set up listener once
  if (typeof window !== 'undefined' && !window.__authStateListenerSetup) {
    window.__authStateListenerSetup = true;
    
    // Listen for auth state changes by periodically checking auth status
    const authCheckInterval = setInterval(() => {
      const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';
      const isCurrentlyAuthenticated = isAuthenticated();
      
      if (wasAuthenticated && !isCurrentlyAuthenticated) {
        // User was authenticated but now isn't - clear private key
        clearPrivateKey();
        sessionStorage.removeItem('was_authenticated');
      } else if (isCurrentlyAuthenticated) {
        sessionStorage.setItem('was_authenticated', 'true');
      }
    }, 5000); // Check every 5 seconds
    
    // Also clean up on page unload as a safety measure
    window.addEventListener('beforeunload', () => {
      clearInterval(authCheckInterval);
    });
  }
};

// For backward compatibility with existing code
export const savePrivateKeyToCookie = savePrivateKey;
export const getPrivateKeyFromCookie = getPrivateKey;
export const clearPrivateKeyFromCookie = clearPrivateKey;
export const handleLogoutEncryptionCleanup = clearPrivateKey;

// Initialize auth state listener when this module is loaded
if (typeof window !== 'undefined') {
  setupAuthStateListener();
}
