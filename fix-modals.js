const fs = require('fs');

function applyInline(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('className="fixed inset-0')) {
    code = code.replace(
      '<div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain">',
      `{inline ? (
        <div className="w-full">
          <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-white">
      ) : (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white my-4">
      )}`
    );
    
    // Replace the closing divs. The original has 3 closing divs:
    // </div></div></div>
    // We need to replace the last three </div> with conditional closing.
    // However, it's easier to just replace the whole return block, but since the content is large, let's just use regex for the end.
    
    // Let's just find the last </div></div></div>
    const lastIndex = code.lastIndexOf('</div>\n      </div>\n    </div>');
    if (lastIndex !== -1) {
      code = code.substring(0, lastIndex) + `</div>
      {inline ? null : </div>}
    </div>` + code.substring(lastIndex + 32);
    }
    
    // Wait, let's do this more cleanly.
  }
}
