const fs = require('fs');
let code = fs.readFileSync('src/components/CampanhaPublicaView.tsx', 'utf8');

// Find where to insert the state for the timer
const regexState = /const \[cartaoNumero, setCartaoNumero\] = useState\(''\);/;
code = code.replace(regexState, `const [cartaoNumero, setCartaoNumero] = useState('');
  const [checkoutTimer, setCheckoutTimer] = useState<number | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkoutAberto && data?.campanha?.checkout?.timerUrgencia?.ativo) {
      if (checkoutTimer === null) {
        setCheckoutTimer((data.campanha.checkout.timerUrgencia.minutos || 10) * 60);
      }
      interval = setInterval(() => {
        setCheckoutTimer(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCheckoutTimer(null);
    }
    return () => clearInterval(interval);
  }, [checkoutAberto, data?.campanha?.checkout?.timerUrgencia]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  };`);

const regexTimerUI = /\{\/\* Mensagem de Urgência \/ Banner Topo \*\/\}/;
code = code.replace(regexTimerUI, `{/* Timer de Urgência Checkout */}
            {campanha.checkout?.timerUrgencia?.ativo && checkoutTimer !== null && checkoutTimer > 0 && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-bold">Oferta expira em:</span>
                </div>
                <span className="text-xl font-mono font-black tracking-widest">{formatTimer(checkoutTimer)}</span>
              </div>
            )}
            
            {/* Mensagem de Urgência / Banner Topo */}`);

fs.writeFileSync('src/components/CampanhaPublicaView.tsx', code);
