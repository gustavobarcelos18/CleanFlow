import re
with open(r'c:\Users\gugur\CleanFlow\src\integrations\supabase\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: any table name followed by content until referencedRelation: "agenda"
# This is a bit lazy but should work
matches = re.finditer(r'(\w+):\s*{[^}]*?referencedRelation:\s*\"agenda\"', content, re.DOTALL)
tables = [m.group(1) for m in matches]
print(list(set(tables)))
