const fs = require('fs');
const path = 'src/components/PixPaymentModal.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = `      </div>
  );
  if (inline) return content;
       <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain">
      <div className="flex min-h-full items-center justify-center p-4">
        {content}
      </div>
    </div>
  );
};`;

const replacement = `      </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain">
      <div className="flex min-h-full items-center justify-center p-4">
        {content}
      </div>
    </div>
  );
};`;

// Wait, the target is still there. Why did the previous replace fail?
// Let's just do an index based replacement.
const lastIndex = code.lastIndexOf('      </div>\n  );\n  if (inline) return content;');
if (lastIndex !== -1) {
  code = code.substring(0, lastIndex) + replacement;
}

fs.writeFileSync(path, code, 'utf8');
