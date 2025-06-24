import os
import sys

# Check for API key in environment variables
if not os.getenv('OPENAI_API_KEY'):
    print("⚠️  Warning: OPENAI_API_KEY not found in environment variables")
    print("The app will run in demo mode with sample data")
    print("To enable food analysis, set your OpenAI API key:")
    print("  Windows: $env:OPENAI_API_KEY='your-key-here'")
    print("  Mac/Linux: export OPENAI_API_KEY='your-key-here'")
    print()

# Import and run the app
from app import app

if __name__ == '__main__':
    print("=" * 50)
    print("CalorieTracker - Food Analysis App")
    print("=" * 50)
    print("Server starting...")
    api_configured = bool(os.getenv('OPENAI_API_KEY'))
    print(f"API Key configured: {'✓' if api_configured else '✗ (Demo mode)'}")
    print("Access your app at: http://localhost:5000")
    print("=" * 50)
    
    app.run(host='127.0.0.1', port=5000, debug=True)