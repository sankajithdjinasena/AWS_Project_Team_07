"""
Quickstart launcher for Telco Churn Prediction Application
Starts FastAPI server on http://localhost:8000
"""

import sys
import os
import uvicorn
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    print("\n[+] Opening web interface at http://localhost:8000 ...")
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    # Ensure project root is in sys.path
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
        
    print("=" * 65)
    print("  AWS Telco Customer Churn Prediction - Team 07")
    print("  FastAPI Backend + React JSX Frontend")
    print("=" * 65)
    print("  Web Interface:    http://localhost:8000")
    print("  Interactive Docs: http://localhost:8000/docs")
    print("=" * 65)
    
    # Open browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run server
    from backend.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
