const fs = require('fs');

const files = [
  'src/components/PixPaymentModal.tsx',
  'src/components/BoletoPaymentModal.tsx',
  'src/components/CartaoSuccessModal.tsx'
];

for (const path of files) {
  let code = fs.readFileSync(path, 'utf8');
  
  // Add inline prop
  code = code.replace(/onClose: \(\) => void;/g, 'onClose: () => void;\n  inline?: boolean;');
  
  // Replace the modal wrapper start
  const startTarget = `<div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-4">`;
      
  const newStart = `const content = (
      <div className={\`relative w-full \${inline ? '' : 'max-w-md'} bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-4\`}>`;

  if (code.includes(startTarget)) {
    code = code.replace(startTarget, newStart);
    
    // Replace the modal wrapper end. 
    // The last </div></div></div>
    const endTarget = `</div>
      </div>
    </div>
  );
};`;
    
    const newEnd = `</div>
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
    
    code = code.replace(endTarget, newEnd);
    fs.writeFileSync(path, code, 'utf8');
    console.log(`Updated ${path}`);
  }
}
