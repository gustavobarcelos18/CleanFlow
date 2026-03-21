import re
with open(r'c:\Users\gugur\CleanFlow\src\integrations\supabase\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all table names that have columns referencing 'agendamento_id' or 'appointment_id'
tables = []
# Pattern: finds the table name followed by Relationships block containing agendamento_id or appointment_id
for table_match in re.finditer(r'(\w+):\s*{\s*Row:.*?Relationships: \[(.*?)\]', content, re.DOTALL):
    table_name = table_match.group(1)
    rels = table_match.group(2)
    if 'agendamento_id' in rels or 'appointment_id' in rels:
        if 'referencedRelation: "agenda"' in rels:
            tables.append(table_name)

print(list(set(tables)))
