import sys, json, subprocess

d = json.load(sys.stdin)
f = d.get('tool_input', {}).get('file_path', '')
fu = f.replace('\\', '/')

if f and fu.startswith('backend/') and f.endswith('.py'):
    try:
        subprocess.run(['ruff', 'check', '--fix', f])
    except FileNotFoundError:
        pass  # ruff not installed yet
