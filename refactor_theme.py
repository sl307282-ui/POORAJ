import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip files that don't import Colors or already import useAppTheme
    if 'useAppTheme' in content:
        return
    if 'Colors' not in content:
        return

    # Look for const theme = Colors[...]
    theme_pattern = r'const\s+theme\s*=\s*Colors\[[^\]]+\];'
    if not re.search(theme_pattern, content):
        return

    # Calculate relative path to useAppTheme hook
    depth = filepath.count('/') - 2
    rel_path = '../' * depth + 'hooks/useAppTheme'
    if depth == 0:
        rel_path = './hooks/useAppTheme'
        if 'hooks' in filepath:
            rel_path = './useAppTheme'
    
    if 'src/components/' in filepath:
        rel_path = '../hooks/useAppTheme'

    # Add the hook import
    hook_import = f"import {{ useAppTheme }} from '{rel_path}';\n"
    
    # Replace `const theme = ...` with `const theme = useAppTheme();`
    content = re.sub(theme_pattern, 'const theme = useAppTheme();', content)
    
    # Insert import
    content = hook_import + content
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
