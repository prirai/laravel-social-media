## Project Tree

```
├── app                   <-- Laravel application logic
│   ├── Console           <-- Custom Artisan commands
│   ├── Http              <-- Controllers, Middleware, Requests
│   ├── Models            <-- Eloquent models (database interactions)
│   ├── Providers         <-- Service providers
│   └── ...
├── config                <-- Application configuration (some files may be modifiable)
│   └── ...
├── database              <-- Database migrations, seeds, and factories
│   ├── migrations        <-- Define database schema changes
│   ├── seeds             <-- Populate the database with initial data
│   └── factories         <-- Generate fake data for testing
├── resources             <-- Frontend assets and views
│   ├── js                <-- React components, JavaScript logic (Likely where most frontend work will happen)
│   ├── css / sass        <-- Stylesheets (if applicable)
│   ├── views             <-- Laravel Blade templates (if applicable)
│   └── ...
├── routes                <-- Define application routes (API and web)
│   ├── api.php           <-- API routes (usually for React frontend communication)
│   ├── web.php           <-- Web routes (for traditional Laravel views, if used)
│   └── ...
├── tests                 <-- Unit and feature tests
│   ├── Feature           <-- Tests that simulate user interactions
│   └── Unit              <-- Tests for individual components and functions
├── vite.config.ts        <-- Vite configuration (adjust build process if necessary)
├── components.json       <-- Shadcn Component file
├── tsconfig.json         <-- Typescript
├── eslint.config.js      <-- Eslint
├── package.json          <-- npm dependencies and scripts
├── composer.json         <-- PHP dependencies
├── ...
├── node_modules/         <-- npm dependencies (do not modify directly)
├── vendor/               <-- Composer dependencies (do not modify directly)
├── storage/              <-- (do not modify directly)
└── public/                <-- (Generated, contain built css/js, do not modify directly, will be overwritten)
```

*   **`app/`**:  The core of your Laravel application.  This is where you'll define your business logic, interact with the database (using Eloquent models), and handle requests.
*   **`config/`**: Configuration files for Laravel and various packages.  Some of these may be modified for specific project needs, but be cautious.  Environment-specific settings should be placed in `.env`.
*   **`database/`**:  Manages your database schema.  Migrations define how the database structure changes over time.  Seeds provide initial data.  Factories are used to generate test data.
*   **`resources/`**: Contains your frontend assets.  `resources/js` is likely where the majority of React development will take place.  `resources/views` holds Blade templates (if you're using them alongside React).
*   **`routes/`**: Defines how URLs map to your application's logic.  `api.php` is crucial for defining the endpoints your React application will use to communicate with the backend.  `web.php` is for traditional Laravel routes.
*   **`tests/`**:  Write tests to ensure your code works as expected.  Feature tests simulate user flows, while unit tests focus on individual components.
*   **`vite.config.ts`**: Configuration for Vite, the build tool used for the React frontend.
*   **`composer.json`** and **`package.json`**: List the PHP and JavaScript dependencies, respectively.  Use `composer` and `npm` (or `yarn`) to manage these.
*   **`node_modules/`** and **`vendor/`**:  Directories containing the installed dependencies.  *Do not modify these directly.*  Use `npm` (or `yarn`) and `composer` to update them.

### Commands

Commands essential for setting up and running the project.

1.  Install JavaScript Dependencies:

    ```bash
    npm i
    ```

2.  Install PHP Dependencies:

    ```bash
    composer install
    ```

3.  Generate Application Key:

    ```bash
    php artisan key:generate
    ```
    This command sets the `APP_KEY` in your `.env` file, applicable only for the first time you clone the project.

4.  Run Database Migrations:

    ```bash
    php artisan migrate
    ```
    This command applies any pending database migrations, creating or updating the database schema.

5.  Build Frontend Assets:

    ```bash
    npm run build
    ```
    This command compiles your React code and other frontend assets into production-ready files.

6.  Start Development Server (combined php and react):

    ```bash
    composer run dev
    ```
    This typically runs both the Laravel development server (using `php artisan serve`) and the Vite development server, allowing you to see your changes in real-time.  It combines hot-reloading for both PHP (using `artisan serve`) and React (using Vite).

7. php artisan storage link 

### Admin Panel (Backpack for Laravel - Optional Setup)

These steps are only required *once* to set up the admin panel.  For ongoing contributions, you usually only need the commands from the previous section.

1.  Install Backpack:

    ```bash
    composer require backpack/crud
    ```

2.  Run Backpack Installer:

    ```bash
    php artisan backpack:install
    ```

### Creating an Admin User (One-Time Setup)

Use Laravel Tinker to create an initial admin user:

```bash
php artisan tinker
```

Inside the Tinker shell, run:

```php
use App\Models\User;

User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('password'),
    'is_admin' => true, // Ensure you have an 'is_admin' flag in your User model
]);

exit; // Exit Tinker
```

**Important:** Ensure your `User` model has an `is_admin` field (or a similar mechanism) to distinguish administrators.  You might need to add a migration to add this field if it doesn't exist:

```bash
php artisan make:migration add_is_admin_to_users_table --table=users
```

Then, in the generated migration file (in `database/migrations`):

```php
// ... inside the up() method ...
$table->boolean('is_admin')->default(false);

// ... inside the down() method ...
$table->dropColumn('is_admin');
```
Finally run, `php artisan migrate`.

### Resetting Admin Password

If you forget the admin password, you can reset it using Tinker:

```bash
php artisan tinker
```

```php
use App\Models\User;

$user = User::where('email', 'admin@example.com')->first();
$user->password = bcrypt('new_password'); // Replace 'new_password' with the desired password
$user->save();
exit;
```

### Backpack Guard Configuration

Ensure your `config/auth.php` file is configured correctly for Backpack.  Specifically, check the `guards` section:

```php
'guards' => [
    // ... other guards ...

    'backpack' => [
        'driver'   => 'session',
        'provider' => 'users', // This should match your users table/provider
    ],
],
```
The `'provider' => 'users'` line is crucial. It tells Backpack to use your `users` table (and the associated `User` model) for authentication.

### Laravel Additional Information
* **Eloquent ORM**: Laravel's Eloquent ORM makes it easy to interact with your database.  You'll define models (usually in `app/Models`) that correspond to your database tables.
*   **Artisan Console**: Laravel's command-line interface, Artisan, provides many helpful commands (like `php artisan migrate`, `php artisan make:model`, etc.).  Run `php artisan list` to see all available commands.
*   **Blade Templating**:  While this project primarily uses React for the frontend, Laravel's Blade templating engine is still available.  You might use it for things like email templates or server-rendered pages.
* **.env file**: The .env file is crucial for the project. It will contain the APP_KEY, database configuration, and other settings. It won't be committed to the source control.
