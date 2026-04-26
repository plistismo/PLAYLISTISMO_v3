import React, { useEffect, useState, useMemo } from 'react';

interface LoveAnimationProps {
  onComplete: () => void;
}

const LoveAnimation: React.FC<LoveAnimationProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);

  const hearts = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      size: `${15 + Math.random() * 30}px`,
      duration: `${3 + Math.random() * 2}s`,
      emoji: ['❤️', '💖', '💘', '💕', '✨'][Math.floor(Math.random() * 5)]
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="absolute bottom-[-10%] animate-love-heart flex items-center justify-center opacity-0"
          style={{
            left: heart.left,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            fontSize: heart.size,
            filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.3))'
          }}
        >
          {heart.emoji}
        </span>
      ))}

      {/* Overlay leve avermelhado nos cantos */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent opacity-50"></div>
    </div>
  );
};

export default LoveAnimation;
