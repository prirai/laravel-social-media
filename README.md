# Social Media Platform

A modern social media platform built with Laravel 12 and React, featuring user authentication, social interactions, marketplace, admin panel, end-to-end encrypted messaging, and blockchain-based verification system.

User Guide: [here](https://github.com/prirai/social-media/blob/main/README.pdf)

## Project Structure

### Core Components

#### Authentication & User Management
- **Controllers**: `app/Http/Controllers/Auth/`
  - `RegisteredUserController.php`: Handles user registration
  - `AuthenticatedSessionController.php`: Manages login/logout
  - `PasswordResetLinkController.php`: Password reset functionality
- **Models**: 
  - `app/Models/User.php`: User model with relationships and attributes
  - `app/Models/Admin.php`: Admin user model for admin panel
- **OTP System**:
  - `app/Http/Controllers/UserController.php`: Handles OTP generation and verification
  - `app/Mail/PasswordResetOtp.php`: Email template for password reset OTPs
  - `app/Mail/EmailVerificationOtp.php`: Email template for email verification OTPs

#### Blockchain System
- **Controllers**: 
  - `BlockchainController.php`: Manages blockchain operations and verification
- **Components**:
  - `Blockchain.tsx`: Blockchain explorer interface
- **Features**:
  - Immutable record of user verifications
  - Moderation action tracking
  - Marketplace listing history
  - Real-time blockchain updates
  - Mobile-responsive explorer

#### Social Features
- **Controllers**: 
  - `PostController.php`: Manages social posts and attachments
  - `CommentController.php`: Handles post comments
  - `LikeController.php`: Manages post likes
- **Models**:
  - `Post.php`: Post model with attachments and relationships
  - `Comment.php`: Comment model
  - `Like.php`: Like model
  - `Attachment.php`: Handles post attachments

#### Messaging System
- **Controllers**: 
  - `MessagingController.php`: Handles direct messaging and attachments
  - `GroupController.php`: Manages group chats
- **Models**:
  - `Message.php`: Direct message model
  - `Group.php`: Group chat model
  - `GroupMessage.php`: Group message model
  - `MessageAttachment.php`: Message attachments
  - `GroupMessageAttachment.php`: Group message attachments
- **Encryption**:
  - `resources/js/utils/crypto.ts`: Handles end-to-end encryption for direct messages

#### Marketplace
- **Controllers**: 
  - `MarketplaceController.php`: Handles listings and transactions
- **Models**:
  - `Listing.php`: Marketplace listing model

#### User Verification
- **Controllers**: 
  - `VerificationController.php`: Manages user verification
  - `CustomEmailVerificationController.php`: Handles email verification via OTP
- **Models**:
  - `VerificationDocument.php`: Stores verification documents
  - `UserReport.php`: Handles user reports

### Frontend Structure
- **React Components**: `resources/js/pages/`
  - `auth/`: Authentication pages with enhanced UI
  - `dashboard/`: Main dashboard with posts and email verification
  - `profile/`: User profile pages with posts and friends tabs
  - `settings/`: User settings
  - `marketplace/`: Marketplace listings
  - `messaging/`: Direct and group messaging with encryption
  - `blockchain/`: Blockchain explorer and verification status
- **UI Components**: `resources/js/components/ui/`
  - `tabs.tsx`: Reusable tabs component
  - `dialog.tsx`: Modal dialogs
  - `button.tsx`: Button components
  - `otp-keyboard.tsx`: On-screen keyboard for OTP input
  - `file-size-warning-dialog.tsx`: Reusable file size warning component
- **Layouts**:
  - `app-sidebar-layout.tsx`: Layout with sidebar and card content
  - `auth-layout.tsx`: Layout for authentication pages
  - `auth-split-layout.tsx`: Split-screen layout for auth pages

### Admin Panel
- **Theme**: Backpack CRUD with Tabler theme
- **Controllers**: `app/Http/Controllers/Admin/`
  - `UserCrudController.php`: User management with blockchain integration
  - `PostCrudController.php`: Post and attachment management
  - `ListingCrudController.php`: Marketplace management
  - `VerificationCrudController.php`: User verification management
  - `UserReportCrudController.php`: User report management
- **Views**: `resources/views/vendor/backpack/`
  - `ui/inc/menu_items.blade.php`: Admin menu configuration

## Database Structure

### Migrations Table

| Migration | Description |
|-----------|-------------|
| `create_users_table` | Base user table with authentication fields |
| `add_username_and_avatar_to_users_table` | Adds username and avatar fields to users |
| `add_is_admin_to_users_table` | Adds admin flag to users |
| `add_public_key_to_users_table` | Adds public key for message encryption |
| `create_posts_table` | Social posts table |
| `create_comments_table` | Post comments table |
| `create_likes_table` | Post likes table |
| `create_messages_table` | Direct messaging table |
| `create_groups_table` | Group chat table |
| `create_listings_table` | Marketplace listings table |
| `create_attachments_table` | File attachments table |
| `create_verification_documents_table` | User verification documents |
| `add_verification_status_to_users_table` | User verification status |
| `create_user_reports_table` | User reporting system |
| `create_blockchain_table` | Blockchain records for verifications and actions |

## Setup Instructions

1. **Install Dependencies**
    ```bash
    composer install
    npm install
    ```

2. **Environment Setup**
    ```bash
    cp .env.example .env
    ```

    Fill the values appropriately, including the MAILER fields with your email address and an app password (for gmail). Appropriate database used with the role and password should be entered.

    Generate a key:

    ```bash
    php artisan key:generate
    ```

3. **Database Setup**
    ```bash
    php artisan migrate
    php artisan storage:link
    php artisan db:seed
    ```

4. **Admin Panel Setup (Not required after clone, first setup only)**
    ```bash
    composer require backpack/crud
    php artisan backpack:install
    ```

5. **Create Admin User**
```bash
php artisan tinker
```
```php
User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => Hash::make('password'),
    'is_admin' => true,
]);
```

6. **Start Development Servers**
```bash
composer run dev
```

## Key Features

- User authentication and authorization with OTP verification
- Social media features (posts, comments, likes)
- Direct messaging and group chats with end-to-end encryption
- Marketplace functionality
- User verification system with blockchain integration
- Admin panel for content management
- File upload and attachment handling
- User reporting system
- OTP-based email verification and password reset
- Responsive UI with dark/light mode support
- On-screen keyboard for secure OTP entry
- Blockchain-based verification and action tracking

## Security Features

- End-to-end encrypted direct messaging using RSA-2048
- Public key infrastructure for secure communication
- OTP-based verification for email and password reset
- Secure on-screen keyboard for OTP entry to prevent keylogging
- Blockchain-based immutable record of verifications and actions
- File size validation and warnings

## Development Guidelines

1. **Adding New Features**
   - Create migration in `database/migrations/`
   - Create model in `app/Models/`
   - Create controller in appropriate directory
   - Add routes in `routes/web.php` or `routes/api.php`
   - Create React components in `resources/js/pages/`

2. **Admin Panel Customization**
   - Modify CRUD controllers in `app/Http/Controllers/Admin/`
   - Customize views in `resources/views/vendor/backpack/`
   - Add new fields in `setupListOperation()` and `setupCreateOperation()`

3. **Frontend Development**
   - Use TypeScript for type safety
   - Follow component structure in `resources/js/pages/`
   - Use Inertia.js for page transitions
   - Implement responsive design using Tailwind CSS
   - Use reusable components for common functionality

## Testing

```bash
php artisan test
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request
