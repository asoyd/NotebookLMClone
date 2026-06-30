import sys, json, subprocess

d = json.load(sys.stdin)
f = d.get('tool_input', {}).get('file_path', '')
fu = f.replace('\\', '/')

if f and 'frontend/src' in fu and f.endswith(('.ts', '.tsx')):
    rel = fu[len('frontend/'):]  # strip "frontend/" prefix
    try:
        subprocess.run(['npx', 'eslint', '--fix', rel], cwd='frontend')
    except FileNotFoundError:
        pass  # npx/eslint not available yet
