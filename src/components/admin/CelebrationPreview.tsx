import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
  emoji?: string;
  delay: number;
  duration: number;
  sway?: number;
}

interface CelebrationPreviewProps {
  estilo: 'confetes' | 'estrela' | 'fogo' | 'coracao' | 'moeda' | 'trofeu' | 'diamante' | 'raio' | 'coroa' | 'foguete' | null;
  onClose: () => void;
}

export const CelebrationPreview: React.FC<CelebrationPreviewProps> = ({ estilo, onClose }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (!estilo) {
      setParticles([]);
      return;
    }

    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    // Initialize particles based on style
    const tempParticles: Particle[] = [];
    const count = estilo === 'raio' ? 10 : estilo === 'foguete' ? 8 : 45;

    const colors = ['#10b981', '#3b82f6', '#ef4444', '#eab308', '#a855f7', '#ec4899', '#f97316'];
    const emojisMap: Record<string, string[]> = {
      estrela: ['⭐', '✨', '🌟'],
      fogo: ['🔥', '💥', '✨'],
      coracao: ['💖', '❤️', '💕', '💘'],
      moeda: ['🪙', '💰', '💵'],
      trofeu: ['🏆', '🏅', '🥇'],
      diamante: ['💎', '✨', '💎'],
      raio: ['⚡', '🌀', '🔌'],
      coroa: ['👑', '👑', '✨'],
      foguete: ['🚀', '🚀', '🔥'],
    };

    if (estilo === 'raio') {
      // Create lightning flash interval
      const interval = setInterval(() => {
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 150);
      }, 800);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    for (let i = 0; i < count; i++) {
      const isBurst = ['estrela', 'trofeu', 'diamante'].includes(estilo);
      
      const p: Particle = {
        id: i,
        // Start from center for burst, or random top/bottom for falling/rising
        x: isBurst ? 50 : Math.random() * 100,
        y: isBurst ? 50 : (estilo === 'fogo' || estilo === 'coracao' || estilo === 'foguete') ? 105 : -10,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojisMap[estilo]?.[Math.floor(Math.random() * (emojisMap[estilo]?.length || 1))],
        delay: Math.random() * 0.8,
        duration: estilo === 'foguete' ? 1.5 + Math.random() * 1.0 : 2.0 + Math.random() * 1.5,
        sway: Math.random() * 30 - 15,
      };
      tempParticles.push(p);
    }

    setParticles(tempParticles);

    return () => {
      clearTimeout(timer);
    };
  }, [estilo, onClose]);

  if (!estilo) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none">
      {/* Background Dim / Flash */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          flashActive 
            ? 'bg-blue-400/20' 
            : estilo === 'fogo' 
              ? 'bg-red-950/10' 
              : 'bg-black/10'
        }`} 
      />

      {/* Styled Anim Particle elements */}
      {estilo === 'confetes' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-3.5 h-3.5 rounded-sm"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                animation: `fallConfetti ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      )}

      {/* Emoji Particles */}
      {estilo !== 'confetes' && estilo !== 'raio' && (
        <div className="absolute inset-0">
          {particles.map((p) => {
            const isBurst = ['estrela', 'trofeu', 'diamante'].includes(estilo);
            const isRising = ['fogo', 'coracao', 'foguete'].includes(estilo);
            const animationName = isBurst 
              ? 'burstEmoji' 
              : isRising 
                ? 'riseEmoji' 
                : 'fallEmoji';

            const tx = p.sway ? p.sway * 18 : 0;
            const ty = p.sway ? (p.id % 2 === 0 ? 1 : -1) * (100 + Math.abs(p.sway) * 12) : 0;

            return (
              <span
                key={p.id}
                className="absolute text-2xl filter drop-shadow-md"
                style={{
                  left: isBurst ? '50%' : `${p.x}%`,
                  top: isBurst ? '50%' : `${p.y}%`,
                  transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                  animation: `${animationName} ${p.duration}s cubic-bezier(0.1, 0.8, 0.3, 1) infinite`,
                  animationDelay: `${p.delay}s`,
                  opacity: 0,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              >
                {p.emoji}
              </span>
            );
          })}
        </div>
      )}

      {/* Special lightning visuals */}
      {estilo === 'raio' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-9xl animate-ping opacity-75"
            style={{ animationDuration: '0.8s' }}
          >
            ⚡
          </span>
          <div className="absolute top-1/4 left-1/3 text-7xl animate-pulse">⚡</div>
          <div className="absolute bottom-1/3 right-1/4 text-8xl animate-pulse delay-100">⚡</div>
        </div>
      )}

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes fallConfetti {
          0% {
            top: -10%;
            transform: rotate(0deg) translateX(0);
          }
          50% {
            transform: rotate(180deg) translateX(25px);
          }
          100% {
            top: 110%;
            transform: rotate(360deg) translateX(-15px);
          }
        }
        @keyframes fallEmoji {
          0% {
            top: -10%;
            opacity: 0;
            transform: rotate(0deg) scale(0.5);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 110%;
            opacity: 0;
            transform: rotate(720deg) scale(1.2);
          }
        }
        @keyframes riseEmoji {
          0% {
            top: 110%;
            opacity: 0;
            transform: translateY(0) rotate(0deg) scale(0.5);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: -10%;
            opacity: 0;
            transform: translateY(-20px) rotate(360deg) scale(1.3);
          }
        }
        @keyframes burstEmoji {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(0deg) scale(0.2);
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) rotate(360deg) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};
