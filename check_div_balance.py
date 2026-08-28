import re

def check_sub_sections():
    with open('src/components/admin/TemaBuilderView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    
    # We will slice lines for each subAbaBotao section:
    # 1. compra: 1248 to 1529
    # 2. pacotes: 1530 to 1840
    # 3. controles: 1845 to 1979
    # 4. cotas: 1980 to 2056
    # 5. cards: 2057 to 2577
    
    sections = [
        ('compra', 1248, 1529),
        ('pacotes', 1530, 1840),
        ('controles', 1841, 1979),
        ('cotas', 1980, 2056),
        ('cards', 2057, 2577)
    ]
    
    for name, start, end in sections:
        stack = []
        extra_closes = 0
        for line_no in range(start, end + 1):
            line = lines[line_no - 1]
            line_clean = re.sub(r'//.*$', '', line)
            
            # Find all <div or </div on this line
            for m in re.finditer(r'<(/?div)(?:\s[^>]*)?>', line_clean):
                token = m.group(1)
                if token == 'div':
                    if m.group(0).endswith('/>'):
                        continue
                    stack.append(line_no)
                elif token == '/div':
                    if not stack:
                        extra_closes += 1
                        print(f"[{name}] Line {line_no}: Extra closing </div>")
                    else:
                        stack.pop()
                        
        print(f"Section [{name}] (Lines {start}-{end}): {len(stack)} unclosed <div>s, {extra_closes} extra closing </div>s")
        if stack:
            print(f"  Unclosed opening lines: {stack}")

if __name__ == '__main__':
    check_sub_sections()
