from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from typing import List, Dict
import glob
from models import FileConfig, TestCase, ExecutionRequest, ExecutionResult, BatchExecutionRequest, GradingRequest, DirectoryRequest
from executor import Executor
import difflib

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
# Default to parent directory of backend, but can be changed
DEFAULT_WORK_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
current_work_dir = DEFAULT_WORK_DIR

def get_config_path():
    return os.path.join(current_work_dir, "grading_config.json")

def load_config() -> Dict[str, List[TestCase]]:
    config_file = get_config_path()
    if not os.path.exists(config_file):
        return {}
    try:
        with open(config_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception:
        return {}

def save_config(data: Dict[str, List[TestCase]]):
    config_file = get_config_path()
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

import subprocess
import sys
import threading
import time

# Global state for directory selection
selection_state = {
    "status": "idle", # idle, running, success, cancelled, error
    "path": None,
    "error": None
}

def run_directory_dialog(script_path, initial_dir):
    global selection_state
    try:
        # Log to file for debugging
        with open("backend_debug.log", "a") as f:
            f.write(f"Thread starting dialog script: {script_path}\n")

        result = subprocess.run(
            [sys.executable, script_path, initial_dir], 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        with open("backend_debug.log", "a") as f:
            f.write(f"Thread finished. Return code: {result.returncode}\n")
            f.write(f"Stdout: {result.stdout}\n")
        
        if result.returncode != 0:
            selection_state["status"] = "error"
            selection_state["error"] = result.stderr
            return

        selected_path = result.stdout.strip()
        if selected_path:
            if os.path.isdir(selected_path):
                selection_state["status"] = "success"
                selection_state["path"] = selected_path
            else:
                selection_state["status"] = "error"
                selection_state["error"] = "Selected path is not a directory"
        else:
            selection_state["status"] = "cancelled"
            
    except Exception as e:
        selection_state["status"] = "error"
        selection_state["error"] = str(e)
        with open("backend_debug.log", "a") as f:
            f.write(f"Thread exception: {e}\n")

@app.post("/api/select-directory/start")
def start_select_directory():
    global selection_state, current_work_dir
    
    # Reset state if not running
    if selection_state["status"] == "running":
        return {"status": "already_running"}
        
    selection_state = {
        "status": "running",
        "path": None,
        "error": None
    }
    
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "directory_dialog.py")
    
    # Start background thread
    thread = threading.Thread(target=run_directory_dialog, args=(script_path, current_work_dir))
    thread.daemon = True
    thread.start()
    
    return {"status": "started"}

@app.get("/api/select-directory/status")
def get_select_directory_status():
    global selection_state, current_work_dir
    
    # If success, update the current_work_dir globally
    if selection_state["status"] == "success" and selection_state["path"]:
        current_work_dir = selection_state["path"]
        
    return selection_state

@app.get("/api/directory")
def get_directory():
    return {"path": current_work_dir}

# Remove the manual set_directory endpoint if not needed, or keep it as backup.
# Keeping it compatible with previous implementation.
@app.post("/api/directory")
def set_directory(request: DirectoryRequest):
    global current_work_dir
    if not os.path.exists(request.path):
        raise HTTPException(status_code=404, detail="Directory not found")
    if not os.path.isdir(request.path):
        raise HTTPException(status_code=400, detail="Path is not a directory")
    current_work_dir = request.path
    return {"status": "success", "path": current_work_dir}

from fastapi.responses import FileResponse

@app.get("/api/files")
def list_files(extension: str = "py"):
    # List files with specific extension(s) in the current work directory
    files = []
    extensions = extension.split(",")
    for ext in extensions:
        search_pattern = os.path.join(current_work_dir, f"*.{ext.strip()}")
        for file in glob.glob(search_pattern):
            files.append(os.path.basename(file))
    return {"files": sorted(files)}

@app.get("/api/files/{filename}")
def get_file_content(filename: str):
    filepath = os.path.join(current_work_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        # Fallback to Shift-JIS (cp932) for Windows environment
        try:
            with open(filepath, "r", encoding="cp932") as f:
                content = f.read()
        except Exception:
             # If both fail, return empty or error message (or handle binary)
             content = "Error: Unable to decode file content."
    
    return {"content": content}

@app.get("/api/pdfs/{filename}")
def get_pdf_content(filename: str):
    filepath = os.path.join(current_work_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    if not filename.lower().endswith(".pdf"):
         raise HTTPException(status_code=400, detail="Not a PDF file")
         
    return FileResponse(filepath, media_type="application/pdf")

@app.get("/api/config/{filename}")
def get_file_config(filename: str):
    config = load_config()
    return {"test_cases": config.get(filename, [])}

@app.post("/api/config/{filename}")
def update_file_config(filename: str, test_cases: List[TestCase]):
    config = load_config()
    config[filename] = [tc.model_dump() for tc in test_cases]
    save_config(config)
    return {"status": "success"}

@app.post("/api/run", response_model=ExecutionResult)
def run_code(request: ExecutionRequest):
    filepath = os.path.join(current_work_dir, request.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    executor = Executor()
    stdout, stderr, exec_time, is_timeout = executor.run(filepath, request.input_data)
    
    status = "PASS"
    if is_timeout:
        status = "TIMEOUT"
    elif stderr:
        status = "ERROR"

    return ExecutionResult(
        filename=request.filename,
        status=status,
        output=stdout,
        error=stderr,
        execution_time=exec_time
    )

@app.post("/api/grade", response_model=ExecutionResult)
def grade_code(request: GradingRequest):
    filepath = os.path.join(current_work_dir, request.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    executor = Executor()
    stdout, stderr, exec_time, is_timeout = executor.run(filepath, request.input_data)
    
    status = "PASS"
    diff = None
    
    if is_timeout:
        status = "TIMEOUT"
    elif stderr:
        status = "ERROR"
    else:
        if request.run_only:
            status = "PASS"
        else:
            actual = stdout.strip().replace("\r\n", "\n")
            expected = request.expected_output.strip().replace("\r\n", "\n")
            
            if actual != expected:
                status = "FAIL"
                diff = "\n".join(difflib.unified_diff(
                    expected.splitlines(), 
                    actual.splitlines(), 
                    fromfile='Expected', 
                    tofile='Actual',
                    lineterm=''
                ))

    return ExecutionResult(
        filename=request.filename,
        status=status,
        output=stdout,
        error=stderr,
        execution_time=exec_time,
        expected_output=request.expected_output,
        diff=diff
    )

@app.post("/api/batch")
def batch_run(request: BatchExecutionRequest):
    config = load_config()
    results = []
    
    common_tests = []
    if request.use_common:
        common_tests = config.get("__COMMON__", [])
    
    for filename in request.filenames:
        filepath = os.path.join(current_work_dir, filename)
        if not os.path.exists(filepath):
            results.append({
                "filename": filename,
                "status": "NOT_FOUND",
                "details": "File not found"
            })
            continue
            
        if request.use_common:
            test_cases = common_tests
        else:
            test_cases = config.get(filename, [])
            
        if not test_cases:
            results.append({
                "filename": filename,
                "status": "NO_TESTS",
                "details": "No test cases defined"
            })
            continue
            
        file_results = []
        executor = Executor()
        
        for i, tc in enumerate(test_cases):
            # tc is a dict here because of json load
            input_data = tc.get("input_data", "")
            expected_output = tc.get("expected_output", "")
            run_only = tc.get("run_only", False)
            
            stdout, stderr, exec_time, is_timeout = executor.run(filepath, input_data)
            
            status = "PASS"
            if is_timeout:
                status = "TIMEOUT"
            elif stderr:
                status = "ERROR"
            else:
                if not run_only:
                    actual = stdout.strip().replace("\r\n", "\n")
                    expected = expected_output.strip().replace("\r\n", "\n")
                    if actual != expected:
                        status = "FAIL"
            
            diff = None
            if status == "FAIL":
                 diff = "\n".join(difflib.unified_diff(
                    expected.splitlines(), 
                    actual.splitlines(), 
                    fromfile='Expected', 
                    tofile='Actual',
                    lineterm=''
                ))

            file_results.append({
                "test_case": i + 1,
                "status": status,
                "execution_time": exec_time,
                "output": stdout,
                "error": stderr,
                "diff": diff
            })
            
        results.append({
            "filename": filename,
            "results": file_results
        })
        
    return {"batch_results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
