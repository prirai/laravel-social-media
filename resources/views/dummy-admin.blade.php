<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ACCESS DENIED</title>
    <link rel="preconnect" href="https://fonts.bunny.net" />
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700&display=swap" rel="stylesheet" />
    <style>
        :root {
            --primary: #ef4444;
            --primary-dark: #dc2626;
            --secondary: #7f1d1d;
            --secondary-dark: #991b1b;
            --background: #0f172a;
            --text: #f8fafc;
            --text-secondary: #cbd5e1;
            --border: #1e293b;
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
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .container {
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        
        .header {
            border-bottom: 1px solid var(--border);
            background-color: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(8px);
            padding: 1rem 0;
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
        
        .warning-content {
            text-align: center;
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(15, 23, 42, 0.7);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        
        .warning-icon {
            font-size: 5rem;
            margin-bottom: 1rem;
            color: var(--primary);
        }
        
        .warning-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--primary);
        }
        
        .warning-message {
            font-size: 1.25rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.7;
        }
        
        .warning-quote {
            font-style: italic;
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            padding: 1rem;
            border-left: 4px solid var(--primary);
            background-color: rgba(239, 68, 68, 0.1);
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
        
        .footer {
            border-top: 1px solid var(--border);
            padding: 1.5rem 0;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        @media (max-width: 640px) {
            .warning-title {
                font-size: 2rem;
            }
            
            .warning-message {
                font-size: 1.125rem;
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
            <div class="warning-content">
                <div class="warning-icon">⚠️</div>
                <h1 class="warning-title">ACCESS DENIED</h1>
                <p class="warning-message">Your attempt to access a restricted area has been detected and logged. Your IP address, browser information, and access time have been recorded for security purposes.</p>
                
                <div class="warning-quote">
                    "The system has been designed to identify and track unauthorized access attempts. Your actions have been flagged and reported to our security team. Continued attempts may result in your IP being permanently blocked."
                </div>
                
                <p class="warning-message">If you believe you should have access to this area, please contact the system administrator with your credentials and reason for access.</p>
                
                <a href="/" class="btn btn-primary">Return to Homepage</a>
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