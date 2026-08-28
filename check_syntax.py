import re

def parse_jsx():
    with open('src/components/admin/TemaBuilderView.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    
    # Let's clean lines from comments and strings to make parsing reliable
    clean_lines = []
    in_multi = False
    for line in lines:
        # Strip single line comments
        line_clean = re.sub(r'//.*$', '', line)
        clean_lines.append(line_clean)

    # Let's find all JSX tags in order
    tag_pattern = re.compile(r'</?([a-zA-Z0-9]+)(?:\s[^>]*)?>')
    
    stack = []
    
    for line_no, line in enumerate(clean_lines, 1):
        # Find all tag tokens
        # To avoid matching standard comparison operators or curly braces, we find actual matches
        for m in re.finditer(r'<(/?[a-zA-Z0-9]+)(?:\s[^>]*)?>', line):
            full_tag = m.group(0)
            tag_name = m.group(1)
            
            # Skip self-closing tags
            if full_tag.endswith('/>'):
                continue
                
            # If it's a closing tag
            if tag_name.startswith('/'):
                name = tag_name[1:]
                if not stack:
                    print(f"Line {line_no}: Extra closing tag <{tag_name}>")
                else:
                    top_name, top_line = stack.pop()
                    if top_name != name:
                        print(f"Line {line_no}: Mismatched closing tag </{name}> closes <{top_name}> from line {top_line}")
            else:
                stack.append((tag_name, line_no))
                
    print(f"\nRemaining unclosed tags in stack: {len(stack)}")
    for tag, line in stack[-30:]:
        print(f"Unclosed <{tag}> opened at line {line}")

if __name__ == '__main__':
    parse_jsx()
