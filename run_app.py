"""
Quickstart launcher for Telco Churn Prediction Application
Starts FastAPI server (with static React JSX frontend bundle)
Automatically detects an open port (defaulting to 8000 or next available)
AWS Project Team 07
"""

import sys
import os
import socket
import argparse
import webbrowser
import threading
import time

def find_available_port(start_port=8000, max_attempts=20):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return start_port

def open_browser(port):
    time.sleep(1.5)
    url = f"http://localhost:{port}"
    print(f"\n[+] Opening web interface at {url} ...")
    webbrowser.open(url)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Launch Telco Churn Full-Stack Application")
    parser.add_argument("--port", type=int, default=None, help="Specific port to bind to")
    args = parser.parse_args()

    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
        
    selected_port = args.port if args.port else find_available_port(8000)

    print("=" * 65)
    print("  AWS Telco Customer Churn Prediction - Team 07")
    print("  FastAPI Backend + React JSX Frontend")
    print("=" * 65)
    print(f"  Web Interface:    http://localhost:{selected_port}")
    print(f"  Interactive Docs: http://localhost:{selected_port}/docs")
    print("=" * 65)
    
    # Auto-open browser
    threading.Thread(target=open_browser, args=(selected_port,), daemon=True).start()
    
    # Run FastAPI server
    from backend.main import app
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=selected_port, log_level="info")
