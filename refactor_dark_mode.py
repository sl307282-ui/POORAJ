import re
import os

FILES = [
    'src/app/(tabs)/search.tsx',
    'src/app/(tabs)/calendar.tsx',
    'src/app/lead/new.tsx',
    'src/app/lead/[id].tsx'
]

COLOR_MAPPING = {
    "'#ffffff'": "theme.surface",
    "'#fff'": "theme.surface",
    "'#f1f5f9'": "theme.background",
    "'#f8fafc'": "theme.surfaceLight",
    "'#e2e8f0'": "theme.border",
    "'#cbd5e1'": "theme.divider",
    "'#0f172a'": "theme.text",
    "'#1e293b'": "theme.text",
    "'#334155'": "theme.textSecondary",
    "'#475569'": "theme.textSecondary",
    "'#64748b'": "theme.icon",
    "'#94a3b8'": "theme.icon",
    "'#0284c7'": "theme.primaryDark",
    "'#0ea5e9'": "theme.primary",
    "'#f0f9ff'": "theme.surfaceLight",
    "'#e0f2fe'": "theme.surfaceLight",
    "'#dcfce7'": "theme.surfaceLight",
    "'#fef3c7'": "theme.surfaceLight",
    "'#fee2e2'": "theme.surfaceLight",
}

for filepath in FILES:
    full_path = os.path.join('/Users/sl307282gmail.com/Desktop/POORAJ', filepath)
    if not os.path.exists(full_path):
        continue
    
    with open(full_path, 'r') as f:
        content = f.read()

    # 1. Add imports if not present
    if "import { useThemeStore }" not in content:
        # Special case for search.tsx which has React, { useState }
        if "import React, { useState }" in content:
            content = content.replace("import React, { useState }", "import { useThemeStore } from '../../store/themeStore';\nimport { Colors } from '../../theme/colors';\nimport React, { useState }")
        else:
            content = content.replace("import React", "import { useThemeStore } from '../../store/themeStore';\nimport { Colors } from '../../theme/colors';\nimport React")

    # 2. Add theme declaration inside the component
    func_match = re.search(r'export default function (\w+)\(.*?\) {', content)
    if func_match:
        func_str = func_match.group(0)
        if "const { mode } = useThemeStore()" not in content:
            theme_decl = f"{func_str}\n  const {{ mode }} = useThemeStore();\n  const theme = Colors[mode === 'dark' ? 'dark' : 'light'];"
            content = content.replace(func_str, theme_decl)

    # 3. Replace hardcoded colors in StyleSheets and inline styles
    for hex_val, theme_val in COLOR_MAPPING.items():
        content = content.replace(f"backgroundColor: {hex_val}", f"backgroundColor: {theme_val}")
        content = content.replace(f"color: {hex_val}", f"color: {theme_val}")
        content = content.replace(f"borderColor: {hex_val}", f"borderColor: {theme_val}")
        content = content.replace(f"tintColor: {hex_val}", f"tintColor: {theme_val}")

    with open(full_path, 'w') as f:
        f.write(content)

print("Refactoring complete.")
