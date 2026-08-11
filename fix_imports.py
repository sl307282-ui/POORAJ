import os
import re

def fix_imports(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Calculate correct relative path to src
    dir_path = os.path.dirname(filepath)
    if dir_path == 'src':
        rel_to_src = './'
    else:
        # e.g. src/app -> 1 level deep -> '../'
        # e.g. src/app/(tabs) -> 2 levels deep -> '../../'
        levels_deep = dir_path.count('/')
        rel_to_src = '../' * levels_deep

    changed = False

    # Fix AppText import
    if re.search(r"import\s+\{\s*AppText\s*\}\s+from\s+['\"].*?AppText['\"];?", content):
        correct_apptext_path = rel_to_src + 'components/AppText'
        content = re.sub(r"import\s+\{\s*AppText\s*\}\s+from\s+['\"].*?AppText['\"];?", f"import {{ AppText }} from '{correct_apptext_path}';", content)
        changed = True

    # Fix useAppTheme import
    if re.search(r"import\s+\{\s*useAppTheme\s*\}\s+from\s+['\"].*?useAppTheme['\"];?", content):
        correct_theme_path = rel_to_src + 'hooks/useAppTheme'
        content = re.sub(r"import\s+\{\s*useAppTheme\s*\}\s+from\s+['\"].*?useAppTheme['\"];?", f"import {{ useAppTheme }} from '{correct_theme_path}';", content)
        changed = True

    if changed:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            if file == 'AppText.tsx' or file == 'themed-text.tsx':
                continue
            fix_imports(os.path.join(root, file))
