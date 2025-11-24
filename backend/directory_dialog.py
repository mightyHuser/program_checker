import tkinter as tk
from tkinter import filedialog
import sys
import os

def select_directory(initial_dir):
    root = tk.Tk()
    root.withdraw()  # Hide the main window
    root.attributes('-topmost', True)  # Make dialog appear on top
    
    try:
        # If initial_dir is provided and exists, use it
        if initial_dir and os.path.exists(initial_dir):
            selected_path = filedialog.askdirectory(initialdir=initial_dir, title="作業ディレクトリを選択")
        else:
            selected_path = filedialog.askdirectory(title="作業ディレクトリを選択")
            
        if selected_path:
            print(selected_path)
        else:
            print("") # Empty string for cancellation
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
    finally:
        root.destroy()

if __name__ == "__main__":
    try:
        with open("dialog_debug.log", "w") as f:
            f.write("Dialog script started\n")
            f.write(f"Arguments: {sys.argv}\n")
            
        initial_dir = sys.argv[1] if len(sys.argv) > 1 else ""
        select_directory(initial_dir)
        
        with open("dialog_debug.log", "a") as f:
            f.write("Dialog script finished\n")
    except Exception as e:
        with open("dialog_debug.log", "a") as f:
            f.write(f"Dialog script crashed: {e}\n")
        sys.exit(1)
