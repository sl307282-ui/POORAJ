import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip files that don't import Text from react-native or already import AppText
    if 'import { AppText }' in content:
        return
    if 'Text' not in content:
        return

    original_content = content
    
    # Check if this file imports Text from react-native
    import_match = re.search(r'import\s+\{([^}]*)\}\s+from\s+[\'"]react-native[\'"]', content)
    if not import_match:
        return
        
    imports = import_match.group(1)
    if 'Text' not in imports.replace(' ', '').split(','):
        return

    # Replace <Text with <AppText and </Text> with </AppText>
    content = content.replace('<Text ', '<AppText ')
    content = content.replace('<Text>', '<AppText>')
    content = content.replace('</Text>', '</AppText>')

    # Calculate relative path to AppText component
    depth = filepath.count('/') - 2 # Assuming script run from root and src/ is depth 1
    rel_path = '../' * depth + 'components/AppText'
    if depth == 0:
        rel_path = './components/AppText'
        if 'components' in filepath:
            rel_path = './AppText'

    if 'src/components/' in filepath:
        rel_path = './AppText'
        if filepath.count('/') > 2:
           rel_path = '../AppText'

    # Add the AppText import
    apptext_import = f"import {{ AppText }} from '{rel_path}';\n"
    
    # We don't remove Text from react-native import because it might be used as a type (e.g. TextProps) 
    # but we should remove the component import to avoid unused variables if we want it super clean.
    # Actually, it's safer to just add AppText import at the top of file
    
    content = apptext_import + content
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            if file == 'AppText.tsx' or file == 'themed-text.tsx':
                continue
            process_file(os.path.join(root, file))
