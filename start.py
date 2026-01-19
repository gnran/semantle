"""
Single command launcher for Semantle game
Starts both backend and frontend servers
"""

import subprocess
import sys
import os
import signal
import time
import threading
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# Store subprocess references for cleanup
processes = []

def cleanup():
    """Terminate all subprocesses"""
    print("\n🛑 Shutting down servers...")
    for process in processes:
        try:
            if sys.platform == "win32":
                process.terminate()
                # On Windows, terminate might not work immediately
                time.sleep(1)
                if process.poll() is None:
                    process.kill()
            else:
                process.terminate()
                time.sleep(1)
                if process.poll() is None:
                    process.kill()
        except Exception as e:
            print(f"Error terminating process: {e}")
    print("✅ Servers stopped")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    cleanup()
    sys.exit(0)

def check_dependencies():
    """Check if required dependencies are installed"""
    # Check if backend venv exists
    venv_python = BACKEND_DIR / "venv" / "Scripts" / "python.exe" if sys.platform == "win32" else BACKEND_DIR / "venv" / "bin" / "python"
    
    if not venv_python.exists():
        print("❌ Backend virtual environment not found!")
        print("Please run the setup first:")
        print("  cd backend")
        print("  python -m venv venv")
        print("  venv\\Scripts\\activate  (Windows)")
        print("  source venv/bin/activate  (Linux/Mac)")
        print("  pip install -r requirements.txt")
        return False
    
    # Check if frontend node_modules exists
    if not (FRONTEND_DIR / "node_modules").exists():
        print("❌ Frontend dependencies not installed!")
        print("Please run: cd frontend && npm install")
        return False
    
    return True

def print_output(process, prefix):
    """Print output from a process with a prefix"""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"[{prefix}] {line.rstrip()}")
    except Exception:
        pass

def start_backend():
    """Start the backend server"""
    print("🚀 Starting backend server...")
    
    # Determine Python executable
    if sys.platform == "win32":
        python_exe = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    else:
        python_exe = BACKEND_DIR / "venv" / "bin" / "python"
    
    if not python_exe.exists():
        print(f"❌ Python executable not found at {python_exe}")
        return None
    
    try:
        # Start backend with output visible
        process = subprocess.Popen(
            [str(python_exe), "main.py"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append(process)
        
        # Start thread to print output
        output_thread = threading.Thread(
            target=print_output,
            args=(process, "BACKEND"),
            daemon=True
        )
        output_thread.start()
        
        # Wait a bit to see if it starts successfully
        time.sleep(2)
        if process.poll() is not None:
            print("❌ Backend failed to start")
            return None
        
        print("✅ Backend server started on http://localhost:8000")
        return process
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None

def find_npm_command():
    """Find the correct npm command for the current platform"""
    # On Windows, try to find npm using where.exe first
    if sys.platform == "win32":
        try:
            result = subprocess.run(
                ["where.exe", "npm"],
                capture_output=True,
                check=True,
                timeout=5
            )
            # Found npm, use npm.cmd (more reliable on Windows)
            return "npm.cmd"
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        # Fallback: try npm.cmd and npm directly
        commands = ["npm.cmd", "npm"]
    else:
        commands = ["npm"]
    
    for cmd in commands:
        try:
            result = subprocess.run(
                [cmd, "--version"],
                capture_output=True,
                check=True,
                timeout=5,
                shell=(sys.platform == "win32")
            )
            return cmd
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    return None

def start_frontend():
    """Start the frontend dev server"""
    print("🚀 Starting frontend server...")
    
    # Find npm command
    npm_cmd = find_npm_command()
    if not npm_cmd:
        print("❌ npm not found! Please install Node.js")
        print("   Download from: https://nodejs.org/")
        print("   Make sure Node.js is added to your PATH")
        print("\n   Troubleshooting:")
        print("   1. Verify npm is installed: Open a new terminal and run 'npm --version'")
        print("   2. If npm works in terminal but not here, restart your terminal")
        print("   3. Check that Node.js installation directory is in your system PATH")
        return None
    
    try:
        # On Windows, use shell=True to ensure npm is found
        use_shell = sys.platform == "win32"
        
        # Start frontend with output visible
        process = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=use_shell
        )
        processes.append(process)
        
        # Start thread to print output
        output_thread = threading.Thread(
            target=print_output,
            args=(process, "FRONTEND"),
            daemon=True
        )
        output_thread.start()
        
        # Wait a bit to see if it starts successfully
        time.sleep(3)
        if process.poll() is not None:
            print("❌ Frontend failed to start")
            return None
        
        print("✅ Frontend server started on http://localhost:3000")
        return process
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return None

def main():
    """Main function to start both servers"""
    print("=" * 50)
    print("🎮 Semantle Game Launcher")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        cleanup()
        sys.exit(1)
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        cleanup()
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ Both servers are running!")
    print("=" * 50)
    print("📱 Frontend: http://localhost:3000")
    print("🔧 Backend:  http://localhost:8000")
    print("\nPress Ctrl+C to stop both servers")
    print("=" * 50 + "\n")
    
    # Monitor processes and print output
    try:
        while True:
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend server stopped unexpectedly")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend server stopped unexpectedly")
                break
            
            # Print output from processes (non-blocking)
            # Note: This is a simple implementation. For better output handling,
            # you might want to use threading or asyncio
            
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
