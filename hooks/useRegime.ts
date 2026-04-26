import { useState, useEffect } from 'react';

export type RegimeType = 'musa' | 'autor';

export const AUTOR_ID = '00000000-0000-0000-0000-000000000001';
export const MUSA_ID = '00000000-0000-0000-0000-000000000002';

export const useRegime = () => {
    const [regime, setRegime] = useState<RegimeType>(() => {
        const hours = new Date().getHours();
        return (hours >= 6 && hours < 18) ? 'musa' : 'autor';
    });

    useEffect(() => {
        const checkRegime = () => {
            const hours = new Date().getHours();
            const newRegime = (hours >= 6 && hours < 18) ? 'musa' : 'autor';
            setRegime((prev) => {
                if (prev !== newRegime) {
                    console.log(`[Regime] Turno alterado para: ${newRegime}`);
                    return newRegime;
                }
                return prev;
            });
        };

        const interval = setInterval(checkRegime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const isMusaTurn = regime === 'musa';
    const isAutorTurn = regime === 'autor';
    const leaderId = isMusaTurn ? MUSA_ID : AUTOR_ID;
    const regimeName = isMusaTurn ? 'Musa' : 'Autor';

    return {
        regime,
        regimeName,
        isMusaTurn,
        isAutorTurn,
        leaderId
    };
};
