import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    if 'StyleSheet.create' in content:
        parts = content.split('StyleSheet.create')
        if len(parts) == 2:
            top_part = parts[0]
            bottom_part = parts[1]
            # In the bottom part, revert theme.primary and theme.primaryDark
            bottom_part = bottom_part.replace("theme.primaryDark", "'#0284c7'")
            bottom_part = bottom_part.replace("theme.primary", "'#0ea5e9'")
            
            content = top_part + 'StyleSheet.create' + bottom_part

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
