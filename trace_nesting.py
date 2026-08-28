import re

def trace_nesting(start, end):
    with open('src/components/admin/TemaBuilderView.tsx', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    nesting = 0
    print(f"--- Tracing lines {start} to {end} ---")
    for line_no in range(start, end + 1):
        line = lines[line_no - 1]
        line_clean = re.sub(r'//.*$', '', line)
        
        # Find all <div or </div on this line
        tokens = []
        for m in re.finditer(r'<(/?div)(?:\s[^>]*)?>', line_clean):
            token = m.group(1)
            if token == 'div' and m.group(0).endswith('/>'):
                continue
            tokens.append(token)
            
        if tokens:
            token_str = ", ".join(tokens)
            old_nesting = nesting
            for tok in tokens:
                if tok == 'div':
                    nesting += 1
                else:
                    nesting -= 1
            print(f"Line {line_no:4d} | Level: {old_nesting} -> {nesting} | Tags: {token_str} | {line.strip()}")

if __name__ == '__main__':
    trace_nesting(1550, 1852)
