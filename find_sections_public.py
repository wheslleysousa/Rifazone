with open('src/components/CampanhaPublicaView.tsx', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        if 'const PremiosSection' in line:
            print(f"PremiosSection start: {idx}: {line.strip()}")
        if 'const CotasPremiadasSection' in line:
            print(f"CotasPremiadasSection start: {idx}: {line.strip()}")
