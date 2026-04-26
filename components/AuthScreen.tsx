import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { AUTOR_ID, MUSA_ID } from '../App';
import { supabase } from '../services/supabase';

interface AuthScreenProps {
  onUnlock: (user: UserProfile) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock }) => {
  const [display, setDisplay] = useState('0');
  const [sequence, setSequence] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const pinsRef = useRef<{ [key: string]: { pin: string, profile: UserProfile } }>({});

  // 1. Carregamento Híbrido (Cache Local + Rede)
  useEffect(() => {
    // A) Carrega IMEDIATAMENTE do cache (Resolve o bug do APK)
    const loadFromCache = () => {
      const cachedUserStr = localStorage.getItem('capy_active_user');
      const cachedPartnerStr = localStorage.getItem('capy_partner');

      const loadProfileToRef = (str: string | null) => {
        if (str) {
          try {
            const p = JSON.parse(str);
            if (p.id && p.pin) {
              pinsRef.current[p.id] = {
                pin: p.pin,
                profile: p
              };
            }
          } catch (e) { console.error("Cache inválido", e); }
        }
      };

      loadProfileToRef(cachedUserStr);
      loadProfileToRef(cachedPartnerStr);
    };

    loadFromCache();

    // B) Atualiza via Supabase em background
    const fetchPins = async () => {
      if (!navigator.onLine) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', [AUTOR_ID, MUSA_ID]);

        if (data) {
          data.forEach((p: any) => {
            if (p.pin) {
              pinsRef.current[p.id] = {
                pin: p.pin,
                profile: {
                  id: p.id,
                  name: p.display_name || 'Usuário',
                  avatar_url: p.avatar_url || '',
                  bio: p.bio || '',
                  pin: p.pin
                }
              };
            }
          });
        }
      } catch (err) {
        console.debug("Modo offline ou erro de conexão.");
      }
    };
    fetchPins();
  }, []);

  // Monitora a sequência digitada
  useEffect(() => {
    const matchedId = Object.keys(pinsRef.current).find(id => sequence.endsWith(pinsRef.current[id].pin));

    if (matchedId) {
      handleUnlock(matchedId);
    }
  }, [sequence]);

  const handleUnlock = (userId: string) => {
    setUnlocking(true);
    let userProfile = pinsRef.current[userId]?.profile;

    // Fallback de segurança caso a Ref falhe (raro com o fix acima)
    if (!userProfile) {
      const cachedUserStr = localStorage.getItem('capy_active_user');
      if (cachedUserStr) {
        const cachedUser = JSON.parse(cachedUserStr) as UserProfile;
        if (cachedUser.id === userId) {
          userProfile = cachedUser;
        }
      }
    }

    if (!userProfile) {
      userProfile = {
        id: userId,
        name: 'Usuário',
        avatar_url: '',
        bio: '',
        pin: ''
      };
    }

    // Vibração "snappy"
    if (navigator.vibrate) navigator.vibrate([10, 50]);

    // Timer para a animação
    setTimeout(() => {
      onUnlock(userProfile!);
    }, 800);
  };

  const inputDigit = (digit: string) => {
    if (unlocking) return; // Bloqueia input durante animação
    if (navigator.vibrate) navigator.vibrate(5);
    setSequence(prev => (prev + digit).slice(-10));
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      if (display.length >= 11) return;
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (unlocking) return;
    if (navigator.vibrate) navigator.vibrate(5);
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearDisplay = () => {
    if (unlocking) return;
    if (navigator.vibrate) navigator.vibrate(5);
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setSequence('');
  };

  const performOperation = (nextOperator: string) => {
    if (unlocking) return;
    if (navigator.vibrate) navigator.vibrate(5);
    const inputValue = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      if (isNaN(newValue)) {
        setDisplay('Erro');
        setPrevValue(null);
      } else {
        setDisplay(String(newValue).slice(0, 11));
        setPrevValue(newValue);
      }
    }
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (prev: number, next: number, op: string) => {
    let result = 0;
    switch (op) {
      case '+': result = prev + next; break;
      case '-': result = prev - next; break;
      case '*': result = prev * next; break;
      case '/': if (next === 0) return NaN; result = prev / next; break;
      default: result = next;
    }
    return parseFloat(result.toPrecision(12));
  };

  const handleEqual = () => {
    if (unlocking) return;
    if (navigator.vibrate) navigator.vibrate(10);
    const inputValue = parseFloat(display);
    if (operator && prevValue !== null) {
      const result = calculate(prevValue, inputValue, operator);
      if (isNaN(result)) {
        setDisplay('Erro');
        setPrevValue(null);
      } else {
        setDisplay(String(result).slice(0, 11));
        setPrevValue(result);
      }
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  // Classes CSS utilitárias
  const calcBtn = "flex items-center justify-center text-2xl font-medium transition-all active:scale-95 duration-100 disabled:opacity-50 disabled:active:scale-100";
  const numBtn = `${calcBtn} bg-[#1c1c1e] text-white rounded-2xl hover:bg-[#2c2c2e]`;
  const opBtn = `${calcBtn} bg-[#2c2c2e] text-blue-400 rounded-2xl hover:bg-[#3a3a3c]`;
  const actionBtn = `${calcBtn} bg-blue-600 text-white rounded-2xl hover:bg-blue-500 shadow-lg shadow-blue-900/20`;

  return (
    <div className="h-full w-full flex flex-col bg-[#000000] relative overflow-hidden font-serif select-none touch-none">
      <div className={`flex flex-col h-full w-full transition-all duration-700 cubic-bezier(0.25, 1, 0.5, 1) ${unlocking ? 'scale-110 opacity-0 filter blur-xl' : 'scale-100'}`}>

        {/* Display refined */}
        <div className="pt-24 px-10 pb-10 flex flex-col justify-end min-h-[35%]">
          <div className="text-right mb-4">
            <span className="text-[10px] uppercase tracking-[0.6em] text-zinc-600 font-black opacity-60">Scientific Engine v2</span>
          </div>
          <div className="text-right text-7xl font-display text-white truncate transition-all leading-tight overflow-hidden tracking-tighter">
            {display}
          </div>
        </div>

        {/* Grid refined - Adicionado disabled={unlocking} */}
        <div className="flex-1 grid grid-cols-4 gap-3 px-6 pb-8">
          <button onClick={clearDisplay} disabled={unlocking} className={opBtn}>AC</button>
          <button onClick={() => performOperation('/')} disabled={unlocking} className={`${opBtn} ${operator === '/' ? 'bg-blue-600 text-white' : ''}`}>÷</button>
          <button onClick={() => performOperation('*')} disabled={unlocking} className={`${opBtn} ${operator === '*' ? 'bg-blue-600 text-white' : ''}`}>×</button>
          <button onClick={() => { }} disabled={unlocking} className={opBtn}>+/-</button>

          <button onClick={() => inputDigit('7')} disabled={unlocking} className={numBtn}>7</button>
          <button onClick={() => inputDigit('8')} disabled={unlocking} className={numBtn}>8</button>
          <button onClick={() => inputDigit('9')} disabled={unlocking} className={numBtn}>9</button>
          <button onClick={() => performOperation('-')} disabled={unlocking} className={`${opBtn} ${operator === '-' ? 'bg-blue-600 text-white' : ''}`}>−</button>

          <button onClick={() => inputDigit('4')} disabled={unlocking} className={numBtn}>4</button>
          <button onClick={() => inputDigit('5')} disabled={unlocking} className={numBtn}>5</button>
          <button onClick={() => inputDigit('6')} disabled={unlocking} className={numBtn}>6</button>
          <button onClick={() => performOperation('+')} disabled={unlocking} className={`${opBtn} ${operator === '+' ? 'bg-blue-600 text-white' : ''}`}>+</button>

          <button onClick={() => inputDigit('1')} disabled={unlocking} className={numBtn}>1</button>
          <button onClick={() => inputDigit('2')} disabled={unlocking} className={numBtn}>2</button>
          <button onClick={() => inputDigit('3')} disabled={unlocking} className={numBtn}>3</button>
          <button onClick={handleEqual} disabled={unlocking} className={actionBtn}>=</button>

          <button onClick={() => inputDigit('0')} disabled={unlocking} className={`${numBtn} col-span-2 text-left px-10`}>0</button>
          <button onClick={inputDot} disabled={unlocking} className={numBtn}>.</button>
          <div className="bg-transparent"></div>
        </div>

        <div className="h-[env(safe-area-inset-bottom)] bg-black"></div>
      </div>

      {/* Pure Animation Overlays */}
      {unlocking && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            {/* Expanding Rings */}
            <div
              className="absolute w-20 h-20 rounded-full border-2 border-blue-400 opacity-0"
              style={{ animation: 'ringExpand 0.8s cubic-bezier(0, 0, 0.2, 1) forwards' }}
            ></div>
            <div
              className="absolute w-20 h-20 rounded-full border border-blue-500/50 opacity-0"
              style={{ animation: 'ringExpand 0.8s cubic-bezier(0, 0, 0.2, 1) 0.15s forwards' }}
            ></div>

            {/* Central Heart */}
            <div
              className="relative z-10"
              style={{ animation: 'heartPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
            >
              <i className="fa-solid fa-heart text-7xl text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"></i>
            </div>
          </div>

          {/* Final White Flash */}
          <div className="absolute inset-0 bg-white opacity-0" style={{ animation: 'flash 0.4s ease-out 0.6s forwards' }}></div>
        </div>
      )}

      <style>{`
        @keyframes ringExpand {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(4); opacity: 0; border-width: 0px; }
        }
        @keyframes heartPop {
          0% { transform: scale(0); opacity: 0; }
          40% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 0.2; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
