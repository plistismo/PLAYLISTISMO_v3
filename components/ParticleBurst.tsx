import React, { useEffect, useState } from 'react';

interface ParticleBurstProps {
  x: number;
  y: number;
  emoji: string;
  onComplete: () => void;
}

const ParticleBurst: React.FC<ParticleBurstProps> = ({ x, y, emoji, onComplete }) => {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
      onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!active) return null;

  const particles = Array.from({ length: 8 }).map((_, i) => {
    // Generate random directions for each particle
    const angle = (i / 8) * 360 + (Math.random() * 20 - 10);
    const distance = 60 + Math.random() * 60;
    const dx = Math.cos(angle * Math.PI / 180) * distance;
    const dy = Math.sin(angle * Math.PI / 180) * distance;

    return (
      <span
        key={i}
        className="absolute pointer-events-none text-xl animate-particle"
        style={{
          left: x,
          top: y,
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
        } as any}
      >
        {emoji}
      </span>
    );
  });

  return <div className="absolute inset-0 z-[9999] pointer-events-none">{particles}</div>;
};

export default ParticleBurst;