import forge from 'node-forge';
import { saveAs } from 'file-saver';

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
  }
}

const COOKIE_NAME = 'pki_private_key';

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
      console.log(`Creating file with username: ${username}`);
    }
    // If no username provided, try to get from window.__page
    else if (isAuthenticated() && window.__page?.props?.auth?.user?.username) {
      const authUsername = window.__page.props.auth.user.username;
      filename = `${authUsername}_secure_msg_privkey_${timestamp}.txt`;
      console.log(`Creating file with auth username: ${authUsername}`);
    } else {
      console.log('No username provided for private key file');
    }
  } catch (error) {
    console.error('Error creating filename for private key:', error);
    // Fall back to default filename with timestamp
  }

  const blob = new Blob([privateKey], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
};

/**
 * Save the private key to a cookie temporarily
 */
export const savePrivateKeyToCookie = (privateKey: string) => {
  try {
    // Set cookie to expire after 2 hours (in seconds)
    const expiryTime = 7200;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(privateKey)};max-age=${expiryTime};path=/;secure;samesite=strict`;
    return true;
  } catch (error) {
    console.error('Error saving private key to cookie:', error);
    return false;
  }
};

/**
 * Get the private key from the cookie
 */
export const getPrivateKeyFromCookie = (): string | null => {
  try {
    const name = `${COOKIE_NAME}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
      const cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
  } catch (error) {
    console.error('Error reading private key from cookie:', error);
  }
  return null;
};

/**
 * Remove the private key from the cookie
 */
export const clearPrivateKeyFromCookie = (): boolean => {
  try {
    document.cookie = `${COOKIE_NAME}=;max-age=0;path=/;`;
    return true;
  } catch (error) {
    console.error('Error clearing private key from cookie:', error);
    return false;
  }
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
    console.error('Encryption error:', error);
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
    console.error('Decryption error:', error);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
};

/**
 * Handle encryption cleanup during user logout
 * This should be called whenever a user logs out to ensure
 * encryption keys don't persist in the browser
 */
export const handleLogoutEncryptionCleanup = (): void => {
  // Skip on auth pages to prevent unnecessary console messages
  if (isAuthPage()) {
    return;
  }
  
  try {
    // Clear the private key cookie
    clearPrivateKeyFromCookie();

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.info('Encryption keys cleared during logout');
    }

    // Could add additional cleanup here in the future if needed
    // Such as clearing localStorage items or resetting other encryption state
  } catch (error) {
    // Only log error in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('Error cleaning up encryption state during logout:', error);
    }
  }
};
