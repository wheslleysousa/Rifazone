import re

def analyze_divs():
    with open('src/components/admin/TemaBuilderView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    
    # Let's clean lines from comments to avoid counting them
    clean_lines = []
    for line in lines:
        line_clean = re.sub(r'//.*$', '', line)
        clean_lines.append(line_clean)
        
    stack = []
    
    # Start tracing from line 423 (the start of return)
    for line_no, line in enumerate(clean_lines, 1):
        if line_no < 423:
            continue
        if line_no > 3091:
            break
            
        # Find all <div ...> and </div> on this line
        # Use finditer to process them in left-to-right order on the line
        for m in re.finditer(r'<(/?div)(?:\s[^>]*)?>', line):
            token = m.group(1)
            if token == 'div':
                # Skip self-closing if any (unlikely for div, but safe)
                if m.group(0).endswith('/>'):
                    continue
                stack.append(line_no)
            elif token == '/div':
                if not stack:
                    print(f"Line {line_no}: Extra closing </div>")
                else:
                    stack.pop()
                    
    print(f"\nRemaining unclosed <div> tags in stack: {len(stack)}")
    for line in stack:
        print(f"Unclosed <div> opened at line {line}")

if __name__ == '__main__':
    analyze_divs()
