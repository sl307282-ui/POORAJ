import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Replace inline colors (in JSX)
    content = content.replace("color=\"#0ea5e9\"", "color={theme.primary}")
    content = content.replace("color=\"#0284c7\"", "color={theme.primaryDark}")
    content = content.replace("color: '#0ea5e9'", "color: theme.primary")
    content = content.replace("color: '#0284c7'", "color: theme.primaryDark")
    content = content.replace("backgroundColor: '#0ea5e9'", "backgroundColor: theme.primary")
    content = content.replace("backgroundColor: '#0284c7'", "backgroundColor: theme.primaryDark")
    content = content.replace("borderColor: '#0ea5e9'", "borderColor: theme.primary")
    content = content.replace("borderColor: '#0284c7'", "borderColor: theme.primaryDark")
    content = content.replace("shadowColor: '#0284c7'", "shadowColor: theme.primaryDark")
    content = content.replace("['#0ea5e9', '#0284c7']", "[theme.primary, theme.primaryDark]")

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
