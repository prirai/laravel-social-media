# Social Media Platform

A modern social media platform built with Laravel 12 and React, featuring user authentication, social interactions, marketplace, and admin panel.

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

#### Marketplace
- **Controllers**: 
  - `MarketplaceController.php`: Handles listings and transactions
- **Models**:
  - `Listing.php`: Marketplace listing model

#### User Verification
- **Controllers**: 
  - `VerificationController.php`: Manages user verification
- **Models**:
  - `VerificationDocument.php`: Stores verification documents
  - `UserReport.php`: Handles user reports

### Frontend Structure
- **React Components**: `resources/js/pages/`
  - `auth/`: Authentication pages
  - `dashboard/`: Main dashboard with posts
  - `profile/`: User profile pages with posts and friends tabs
  - `settings/`: User settings
  - `marketplace/`: Marketplace listings
  - `messaging/`: Direct and group messaging
- **UI Components**: `resources/js/components/ui/`
  - `tabs.tsx`: Reusable tabs component
  - `dialog.tsx`: Modal dialogs
  - `button.tsx`: Button components

### Admin Panel
- **Theme**: Backpack CRUD with Tabler theme
- **Controllers**: `app/Http/Controllers/Admin/`
  - `UserCrudController.php`: User management
  - `PostCrudController.php`: Post and attachment management
  - `ListingCrudController.php`: Marketplace management
  - `VerificationCrudController.php`: User verification management
- **Views**: `resources/views/vendor/backpack/`
  - `ui/inc/menu_items.blade.php`: Admin menu configuration

## Database Structure

### Migrations Table

| Migration | Description |
|-----------|-------------|
| `create_users_table` | Base user table with authentication fields |
| `add_username_and_avatar_to_users_table` | Adds username and avatar fields to users |
| `add_is_admin_to_users_table` | Adds admin flag to users |
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

## Setup Instructions

1. **Install Dependencies**
    ```bash
    composer install
   npm install
    ```

2. **Environment Setup**
    ```bash
   cp .env.example .env
    php artisan key:generate
    ```

3. **Database Setup**
    ```bash
    php artisan migrate
   php artisan storage:link
   php artisan db:seed
   ```

4. **Admin Panel Setup**
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

- User authentication and authorization
- Social media features (posts, comments, likes)
- Direct messaging and group chats
- Marketplace functionality
- User verification system
- Admin panel for content management
- File upload and attachment handling
- User reporting system

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