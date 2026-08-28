import re

def check_sub_sections():
    with open('src/components/admin/TemaBuilderView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    
    # Precise sections division
    sections = [
        ('compra', 1248, 1547),
        ('pacotes', 1550, 1852),
        ('controles', 1853, 1990),
        ('cotas', 1991, 2055),
        ('cards', 2056, 2577)
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
