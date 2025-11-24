import subprocess
import time
from typing import Tuple
import sys
import os

class Executor:
    def __init__(self, timeout: int = 5):
        self.timeout = timeout

    def run(self, filepath: str, input_data: str) -> Tuple[str, str, float, bool]:
        """
        Runs the python script at filepath with input_data.
        Returns: (stdout, stderr, execution_time, is_timeout)
        """
        start_time = time.time()
        try:
            # Ensure we use the same python interpreter
            python_executable = sys.executable
            
            process = subprocess.Popen(
                [python_executable, filepath],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=os.path.dirname(filepath) # Run in the file's directory
            )
            
            stdout, stderr = process.communicate(input=input_data, timeout=self.timeout)
            execution_time = time.time() - start_time
            return stdout, stderr, execution_time, False

        except subprocess.TimeoutExpired:
            process.kill()
            execution_time = time.time() - start_time
            return "", "Timeout Expired", execution_time, True
        except Exception as e:
            execution_time = time.time() - start_time
            return "", str(e), execution_time, False
