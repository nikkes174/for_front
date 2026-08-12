import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("CLIENT_CIRCOUT_DB_URL") or os.getenv("DB_URL")
APP_HOST = os.getenv("CLIENT_CIRCOUT_HOST", "127.0.0.1")
APP_PORT = int(os.getenv("CLIENT_CIRCOUT_PORT", "8011"))
LOYLYTY_API_URL = os.getenv("LOYLYTY_API_URL", "http://127.0.0.1:8041")
AUTH_AND_LOGGING_API_URL = os.getenv("AUTH_AND_LOGGING_API_URL", "http://127.0.0.1:7998")
WEB_PUSH_VAPID_PUBLIC_KEY = os.getenv("WEB_PUSH_VAPID_PUBLIC_KEY", "")
WEB_PUSH_VAPID_PRIVATE_KEY = os.getenv("WEB_PUSH_VAPID_PRIVATE_KEY", "")
WEB_PUSH_VAPID_SUBJECT = os.getenv("WEB_PUSH_VAPID_SUBJECT", "mailto:admin@example.com")

if not DATABASE_URL:
    raise RuntimeError("CLIENT_CIRCOUT_DB_URL or DB_URL is not configured")
