# Standalone Web Dashboard for Telegram Link Classifier Bot

This folder contains the complete frontend dashboard files, optimized for standalone hosting (e.g., GitHub Pages, Netlify, Vercel, or any static file server).

## Files Included

1. `index.html` - The HTML structure (includes Telegram WebApp SDK and FontAwesome support).
2. `style.css` - Deep Space Dark Theme stylesheet (responsive with Group Details sidebar and progress bars).
3. `app.js` - Client-side Javascript logic (handles authentication and connects to the backend API).

## How to Host Individually

1. Copy the contents of this folder (`index.html`, `style.css`, `app.js`) to your hosting provider or local directory.
2. Open the dashboard in a web browser.
3. Click the **Settings (Gear Icon)** in the sidebar header.
4. Enter your **Backend API Base URL** (e.g., `https://your-bot-api-domain.com` or `http://localhost:8000`).
5. (Optional) Provide a **Bypass Token / WebApp Init Data** if accessing outside the Telegram WebApp client during local development.
6. Click **Save Changes**. The dashboard will reload and fetch data directly from your configured backend!

## Important Notes: CORS configuration

Since you are hosting the web page on a different domain than the backend API, your FastAPI server must allow Cross-Origin Resource Sharing (CORS).

If you see errors related to CORS in your browser developer console:
Update your bot server's FastAPI startup configuration (typically in `telegram_link_classifier_backup/api/web_server.py`) to include the CORSMiddleware.

Example backend modification:
```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Link Classifier Web Dashboard")

# Add CORS Middleware to allow requests from your frontend host
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this with your frontend domain for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
