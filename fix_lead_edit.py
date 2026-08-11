import os

filepath = 'src/app/lead/edit/[id].tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add import if missing
if 'useAppTheme' not in content:
    content = "import { useAppTheme } from '../../../hooks/useAppTheme';\n" + content

# Add const theme = useAppTheme(); inside EditLead component
if 'const theme = useAppTheme();' not in content:
    content = content.replace('export default function EditLead() {', 'export default function EditLead() {\n  const theme = useAppTheme();')

with open(filepath, 'w') as f:
    f.write(content)
print(f"Fixed {filepath}")
