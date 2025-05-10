import Elysia from "elysia";
import { html } from "@elysiajs/html"
const root = new Elysia()

root.use(html()).get("", ({ }) => {
    return (`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskZen API | Simple Task Management</title>
    <style>
        :root {
            --primary: #6366f1;
            --primary-light: #818cf8;
            --text: #1e293b;
            --text-light: #64748b;
            --bg: #ffffff;
            --border: #e2e8f0;
            --code-bg: #f8fafc;
            --card-bg: #ffffff;
        }

        [data-theme="dark"] {
            --primary: #818cf8;
            --primary-light: #a5b4fc;
            --text: #f1f5f9;
            --text-light: #94a3b8;
            --bg: #0f172a;
            --border: #334155;
            --code-bg: #1e293b;
            --card-bg: #1e293b;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--bg);
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            transition: background 0.3s ease, color 0.3s ease;
        }

        header {
            margin: 6rem 0 8rem;
            text-align: center;
            position: relative;
        }

        .theme-toggle {
            position: absolute;
            top: 0;
            right: 0;
            background: none;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem;
            border-radius: 50%;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .theme-toggle:hover {
            background: rgba(99, 102, 241, 0.1);
            color: var(--primary);
        }

        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            background: linear-gradient(90deg, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            letter-spacing: -0.05em;
        }

        h2 {
            font-size: 1.75rem;
            font-weight: 600;
            margin: 4rem 0 1.5rem;
            letter-spacing: -0.02em;
        }

        p, li {
            color: var(--text-light);
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
        }

        a {
            color: var(--primary);
            text-decoration: none;
            transition: all 0.2s ease;
        }

        a:hover {
            opacity: 0.8;
        }

        .btn {
            display: inline-block;
            padding: 0.8rem 2rem;
            background: var(--primary);
            color: white;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.2s ease;
            margin: 0.5rem;
            box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
        }

        .btn.outline {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            box-shadow: none;
        }

        .btn.outline:hover {
            background: rgba(99, 102, 241, 0.05);
        }

        code {
            font-family: 'Fira Code', monospace;
            background: var(--code-bg);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9rem;
            transition: background 0.3s ease;
        }

        pre {
            font-family: 'Fira Code', monospace;
            background: var(--code-bg);
            padding: 1.5rem;
            border-radius: 12px;
            overflow-x: auto;
            margin: 2.5rem 0;
            border: 1px solid var(--border);
            font-size: 0.9rem;
            line-height: 1.5;
            transition: all 0.3s ease;
        }

        ul {
            padding-left: 1.5rem;
        }

        li {
            margin-bottom: 0.75rem;
        }

        footer {
            margin-top: 8rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
            text-align: center;
            color: var(--text-light);
        }

        @media (max-width: 600px) {
            body {
                padding: 1.5rem;
            }
            
            h1 {
                font-size: 2.25rem;
            }
            
            .btn {
                display: block;
                margin: 0.75rem 0;
            }
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
            <i class="fas fa-moon"></i>
        </button>
        <h1>TaskZen API</h1>
        <p>A clean, fast API for modern task management.</p>
        <div>
            <a href="#docs" class="btn">Get Started</a>
            <a href="#" class="btn outline">Documentation</a>
        </div>
    </header>

    <main>
        <section>
            <h2>Why TaskZen?</h2>
            <p>Built for developers who value simplicity and performance.</p>
            <ul>
                <li><strong>Lightning-fast</strong> – Global CDN for low-latency responses</li>
                <li><strong>Zero-config</strong> – Start in minutes with clear docs</li>
                <li><strong>Scalable</strong> – From hobby projects to enterprise</li>
                <li><strong>Webhook support</strong> – Real-time updates</li>
            </ul>
        </section>

        <section id="docs">
            <h2>Quick Start</h2>
            <p>Create your first task with a single API call:</p>
            <pre><code>POST https://api.taskzen.com/v1/tasks
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "title": "Build an amazing app",
  "due_date": "2023-12-31",
  "priority": "high"
}</code></pre>
            <a href="#" class="btn">Get Your API Key</a>
        </section>
    </main>

    <footer>
        <p>© 2023 TaskZen API</p>
    </footer>

    <script>
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Set initial theme
        if (localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && prefersDarkScheme.matches)) {
            document.body.setAttribute('data-theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        }
        
        // Toggle theme
        themeToggle.addEventListener('click', () => {
            if (document.body.getAttribute('data-theme') === 'dark') {
                document.body.removeAttribute('data-theme');
                icon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                icon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            }
        });
    </script>
</body>
</html>
        `)
}).get("/about", () => {
    return (`
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About | TaskZen API</title>
    <style>
        :root {
            --primary: #6366f1;
            --primary-light: #818cf8;
            --text: #1e293b;
            --text-light: #64748b;
            --bg: #ffffff;
            --border: #e2e8f0;
        }

        [data-theme="dark"] {
            --primary: #818cf8;
            --primary-light: #a5b4fc;
            --text: #f1f5f9;
            --text-light: #94a3b8;
            --bg: #0f172a;
            --border: #334155;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--bg);
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            transition: background 0.3s ease, color 0.3s ease;
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4rem;
        }

        .logo {
            font-weight: 700;
            font-size: 1.25rem;
            color: var(--primary);
            text-decoration: none;
        }

        .nav-links a {
            margin-left: 1.5rem;
            color: var(--text-light);
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .nav-links a:hover {
            color: var(--primary);
        }

        .theme-toggle {
            background: none;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            font-size: 1.2rem;
            margin-left: 1.5rem;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 2rem;
            background: linear-gradient(90deg, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 3rem 0 1.5rem;
        }

        p {
            color: var(--text-light);
            margin-bottom: 1.5rem;
        }

        .team {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }

        .team-member {
            text-align: center;
        }

        .team-member img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 1rem;
            border: 3px solid var(--primary);
        }

        footer {
            margin-top: 6rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
            text-align: center;
            color: var(--text-light);
        }

        @media (max-width: 600px) {
            nav {
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 3rem;
            }
            
            .nav-links {
                margin-top: 1rem;
            }
            
            .nav-links a {
                margin: 0 0.75rem;
            }
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <nav>
        <a href="/" class="logo">TaskZen</a>
        <div class="nav-links">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/docs">Docs</a>
            <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
                <i class="fas fa-moon"></i>
            </button>
        </div>
    </nav>

    <main>
        <h1>About TaskZen</h1>
        
        <p>TaskZen is a minimalist task management API built for developers who value simplicity and performance. We believe task management should be straightforward, flexible, and easy to integrate into any application.</p>
        
        <h2>Our Story</h2>
        
        <p>Founded in 2023 by a team of developers frustrated with bloated task management solutions, TaskZen was born out of a need for something simpler. We set out to create an API that does one thing well: help you manage tasks without unnecessary complexity.</p>
        
        <h2>The Team</h2>
        
        <div class="team">
            <div class="team-member">
                <img src="https://i.pravatar.cc/150?img=1" alt="Alex Chen">
                <h3>Alex Chen</h3>
                <p>Founder & CEO</p>
            </div>
            <div class="team-member">
                <img src="https://i.pravatar.cc/150?img=5" alt="Jamie Patel">
                <h3>Jamie Patel</h3>
                <p>Lead Developer</p>
            </div>
            <div class="team-member">
                <img src="https://i.pravatar.cc/150?img=11" alt="Taylor Smith">
                <h3>Taylor Smith</h3>
                <p>Product Designer</p>
            </div>
        </div>
        
        <h2>Our Values</h2>
        
        <p><strong>Simplicity:</strong> We focus on core functionality without feature bloat.</p>
        
        <p><strong>Developer Experience:</strong> Clean documentation and intuitive design are our priorities.</p>
        
        <p><strong>Performance:</strong> We optimize for speed at every level of our stack.</p>
    </main>

    <footer>
        <p>© 2023 TaskZen API. All rights reserved.</p>
    </footer>

    <script>
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        if (localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && prefersDarkScheme.matches)) {
            document.body.setAttribute('data-theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        }
        
        themeToggle.addEventListener('click', () => {
            if (document.body.getAttribute('data-theme') === 'dark') {
                document.body.removeAttribute('data-theme');
                icon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                icon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            }
        });
    </script>
</body>
</html>
        `)
})

export default root