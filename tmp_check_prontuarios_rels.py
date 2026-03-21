import re

with open(r'c:\Users\gugur\CleanFlow\src\integrations\supabase\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Imprimir as relações da tabela prontuarios na íntegra para análise
match = re.search(r'prontuarios:\s*{(.*?)\s*Relationships: \[(.*?)\]', content, re.DOTALL)
if match:
    # print(match.group(2))
    # Vamos imprimir as linhas exatas de Relationships
    body = match.group(0)
    print(body[body.find('Relationships'):])
else:
    print("Prontuarios not found")
