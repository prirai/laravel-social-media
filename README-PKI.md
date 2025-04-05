# End-to-End Encryption for Direct Messages

This application implements Public Key Infrastructure (PKI) for secure end-to-end encrypted messaging. This document explains how the encryption system works and how to use it.

## How It Works

The system uses RSA-2048 encryption with the following principles:

1. **Key Generation:** Each user generates a public/private key pair. The public key is stored on the server, while the private key is saved as a text file on the user's device.

2. **Zero Server Storage:** Private keys are never stored on the server - they are only stored temporarily in a cookie after the user provides them.

3. **End-to-End Encryption:** When a user sends an encrypted message to another user, the message is encrypted with the recipient's public key. Only the recipient, with their private key, can decrypt the message.

4. **Cookie-Based Key Management:** After uploading or generating a private key, it is stored in a cookie for the current session (2 hours), eliminating the need to re-upload the key for each message.

## Technical Implementation

### Key Components

1. **Encryption Utilities (`crypto.ts`):**
   - `generateKeyPair()`: Creates a new RSA key pair
   - `encryptMessage()`: Encrypts a message using a recipient's public key
   - `decryptMessage()`: Decrypts a message using the user's private key
   - `savePrivateKeyToFile()`: Downloads the private key as a text file
   - `savePrivateKeyToCookie()`: Saves the private key in a cookie for the session
   - `getPrivateKeyFromCookie()`: Retrieves the private key from the cookie

2. **Database:**
   - `users` table has a `public_key` column to store each user's public key
   - `messages` table has an `is_encrypted` boolean flag to indicate encrypted messages

3. **User Interface:**
   - **Encryption Setup Dialog:** Guides users through key generation or uploading an existing key
   - **Encryption Toggle:** Allows users to enable/disable encryption per message
   - **Encryption Indicators:** Shows which messages are encrypted in the chat interface

## User Guide

### Setting Up Encryption

1. **First-Time Setup:**
   - When clicking the encryption lock icon for the first time, you'll be prompted to set up encryption
   - Choose "Generate New Keys" to create a new key pair
   - Your private key will be automatically downloaded as a text file - keep it safe!
   - Your public key will be stored on the server

2. **Using an Existing Key:**
   - If you have a private key from a previous session, choose "Use Existing Key"
   - Paste your private key from the text file
   - The system will validate the key and enable encryption

### Sending Encrypted Messages

1. Click the lock icon in the message input area to toggle encryption on/off
2. When enabled, the icon turns green, indicating your message will be encrypted
3. Type your message and send it - the recipient will see an encryption indicator
4. Only the recipient can decrypt the message with their private key

### Security Considerations

- **Keep Your Private Key Safe:** If you lose your private key, you cannot decrypt past messages
- **Key Rotation:** For maximum security, generate new keys periodically
- **Cookie Expiration:** Your private key cookie expires after 2 hours for security
- **Attachments:** Note that file attachments are not encrypted in the current implementation

## Technical Limitations

- Group messages cannot be encrypted due to the nature of public key encryption
- File attachments are not encrypted in the current implementation
- Messages are stored encrypted in the database, so server administrators cannot read them
- Cookie-based storage is used for convenience, but for higher security, consider using the Web Crypto API and proper key management

## Future Improvements

- Implement hybrid encryption for larger messages and attachments
- Add signature verification to ensure message authenticity
- Add key rotation functionality with key history
- Improve attachment encryption 