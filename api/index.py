import os
import sys

# Add the backend directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Import and initialize Django WSGI application
from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()

# Vercel Serverless Function handler
def handler(request, context):
    return app(request, context)
