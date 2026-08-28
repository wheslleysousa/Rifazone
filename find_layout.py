with open('src/components/admin/TemaBuilderView.tsx', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        if 'midia' in line.lower() or 'fundo' in line.lower() or 'secaoeditor === \'blocos\'' in line.lower():
            if idx > 2500 or 'fundo' in line.lower():
                print(f"{idx}: {line.strip()}")
