from pydantic import BaseModel
from typing import List, Optional

class TestCase(BaseModel):
    input_data: str
    expected_output: str
    run_only: bool = False

class FileConfig(BaseModel):
    filename: str
    test_cases: List[TestCase] = []

class ExecutionRequest(BaseModel):
    filename: str
    input_data: str

class ExecutionResult(BaseModel):
    filename: str
    status: str  # "PASS", "FAIL", "TIMEOUT", "ERROR"
    output: str
    error: str
    execution_time: float
    expected_output: Optional[str] = None
    diff: Optional[str] = None

class BatchExecutionRequest(BaseModel):
    filenames: List[str]
    use_common: bool = False

class GradingRequest(BaseModel):
    filename: str
    input_data: str
    expected_output: str
    run_only: bool = False

class DirectoryRequest(BaseModel):
    path: str
