import forge from 'node-forge';
import { saveAs } from 'file-saver';

const COOKIE_NAME = 'pki_private_key';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

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
export const savePrivateKeyToFile = (privateKey: string) => {
  const blob = new Blob([privateKey], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, 'secure_messaging_private_key.txt');
};

/**
 * Save the private key to a cookie temporarily
 */
export const savePrivateKeyToCookie = (privateKey: string) => {
  // Set cookie to expire after 2 hours (in seconds)
  const expiryTime = 7200;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(privateKey)};max-age=${expiryTime};path=/;secure;samesite=strict`;
};

/**
 * Get the private key from the cookie
 */
export const getPrivateKeyFromCookie = (): string | null => {
  const name = `${COOKIE_NAME}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
};

/**
 * Remove the private key from the cookie
 */
export const clearPrivateKeyFromCookie = () => {
  document.cookie = `${COOKIE_NAME}=;max-age=0;path=/;`;
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
  } catch (error) {
    return false;
  }
}; 