import json
import subprocess
import sys

data = json.load(sys.stdin)
file_path = (data.get("tool_input") or data).get("file_path", "")

if not file_path.endswith(".py"):
    sys.exit(0)

result = subprocess.run(
    [sys.executable, "-m", "ruff", "check", "--fix", file_path],
    capture_output=True,
    text=True,
)
if result.stdout:
    print(result.stdout)
if result.returncode not in (0, 1):
    print(result.stderr, file=sys.stderr)
    sys.exit(result.returncode)
