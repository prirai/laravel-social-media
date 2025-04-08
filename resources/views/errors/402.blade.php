<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>402 - Payment Required</title>
    <link rel="preconnect" href="https://fonts.bunny.net" />
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700&display=swap" rel="stylesheet" />
    <style>
        :root {
            --primary: #3b82f6;
            --primary-dark: #2563eb;
            --secondary: #6366f1;
            --secondary-dark: #4f46e5;
            --background: #ffffff;
            --text: #111827;
            --text-secondary: #4b5563;
            --border: #e5e7eb;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --primary: #60a5fa;
                --primary-dark: #3b82f6;
                --secondary: #818cf8;
                --secondary-dark: #6366f1;
                --background: #111827;
                --text: #f9fafb;
                --text-secondary: #d1d5db;
                --border: #374151;
            }
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--background);
            color: var(--text);
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .container {
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        
        .header {
            border-bottom: 1px solid var(--border);
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            padding: 1rem 0;
        }
        
        @media (prefers-color-scheme: dark) {
            .header {
                background-color: rgba(17, 24, 39, 0.8);
            }
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: 600;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-decoration: none;
        }
        
        .main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 0;
        }
        
        .error-content {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        
        .error-code {
            font-size: 8rem;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 1rem;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        
        .error-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        .error-message {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }
        
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            font-weight: 500;
            text-align: center;
            text-decoration: none;
            border-radius: 0.5rem;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: linear-gradient(to right, var(--primary), var(--secondary));
            color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .btn-primary:hover {
            background: linear-gradient(to right, var(--primary-dark), var(--secondary-dark));
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .btn-secondary {
            background-color: rgba(255, 255, 255, 0.8);
            color: var(--text);
            border: 1px solid var(--border);
        }
        
        @media (prefers-color-scheme: dark) {
            .btn-secondary {
                background-color: rgba(17, 24, 39, 0.5);
            }
        }
        
        .btn-secondary:hover {
            background-color: rgba(255, 255, 255, 0.9);
        }
        
        @media (prefers-color-scheme: dark) {
            .btn-secondary:hover {
                background-color: rgba(17, 24, 39, 0.7);
            }
        }
        
        .btn-group {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        
        .footer {
            border-top: 1px solid var(--border);
            padding: 1.5rem 0;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        @media (max-width: 640px) {
            .error-code {
                font-size: 6rem;
            }
            
            .error-title {
                font-size: 1.5rem;
            }
            
            .btn-group {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container header-content">
            <a href="/" class="logo">SimpleSocial</a>
        </div>
    </header>
    
    <main class="main">
        <div class="container">
            <div class="error-content">
                <div class="error-code">402</div>
                <h1 class="error-title">Payment Required</h1>
                <p class="error-message">This resource requires payment to access. Please complete the payment process to continue.</p>
                <div class="btn-group">
                    <a href="/" class="btn btn-primary">Go to Homepage</a>
                    <a href="/pricing" class="btn btn-secondary">View Pricing</a>
                </div>
            </div>
        </div>
    </main>
    
    <footer class="footer">
        <div class="container">
            &copy; {{ date('Y') }} SimpleSocial. All rights reserved.
        </div>
    </footer>
</body>
</html>
