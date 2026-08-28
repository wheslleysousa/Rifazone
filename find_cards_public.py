with open('src/components/CampanhaPublicaView.tsx', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        if 'tema' in line or 'card' in line.lower() or 'style' in line.lower() or 'cor' in line.lower():
            if any(k in line.lower() for k in ['fundo', 'borda', 'texto', 'barra', 'badge', 'premio', 'ranking', 'regulamento']):
                print(f"{idx}: {line.strip()}")
