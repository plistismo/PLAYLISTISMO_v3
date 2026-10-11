import React from 'react';

export const ManualIsometricSchematic: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-2 sm:p-3 select-none text-[#111111]">
      {/* Blueprint Header Strip */}
      <div className="flex items-center justify-between border-b-2 border-[#084c78]/40 pb-1 mb-1 font-mono-tech text-[9px] sm:text-[10px] text-[#084c78]">
        <span className="font-bold tracking-wider">FIG 3.1 // ISOMETRIC CHASSIS PROJECTION</span>
        <span className="opacity-90 font-semibold">TOLERANCE ±0.02mm • 1PX VECTOR</span>
      </div>

      {/* SVG Wireframe Diagram */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center py-1">
        <svg 
          viewBox="0 0 460 250" 
          className="w-full h-full max-h-[190px] object-contain stroke-current"
          style={{ vectorEffect: 'non-scaling-stroke' }}
        >
          {/* Isometric Grid Accent Dots */}
          <g opacity="0.35" fill="#084c78">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 15 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={30 + c * 28} cy={20 + r * 28} r="0.8" />
              ))
            )}
          </g>

          {/* Dimension Guidelines (Cyan blueprint lines) */}
          <g stroke="#084c78" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.8">
            <line x1="45" y1="210" x2="415" y2="210" />
            <line x1="45" y1="205" x2="45" y2="215" />
            <line x1="415" y1="205" x2="415" y2="215" />
            <text x="230" y="222" fontSize="7.5" fontFamily="'Space Mono', monospace" fill="#084c78" textAnchor="middle" stroke="none" fontWeight="bold">
              430.0 mm (17.0" CHASSIS WIDTH)
            </text>
          </g>

          {/* CRT Cabinet Isometric Outline (1.2px solid black ink lines) */}
          <g stroke="#111111" strokeWidth="1.3" fill="none" strokeLinejoin="round" strokeLinecap="round">
            {/* Front Bezel */}
            <polygon points="90,70 330,30 390,130 150,170" fill="rgba(8,76,120,0.04)" />
            
            {/* Front Screen Inset (Curved Tube) */}
            <path 
              d="M 120,80 Q 210,65 310,50 Q 345,100 365,125 Q 265,145 165,155 Q 135,115 120,80 Z" 
              stroke="#084c78" 
              strokeWidth="1.6"
              fill="rgba(8,76,120,0.08)" 
            />

            {/* Phosphor Grid Lines inside tube */}
            <g stroke="#084c78" strokeWidth="0.6" opacity="0.6">
              <line x1="145" y1="78" x2="190" y2="152" />
              <line x1="190" y1="71" x2="235" y2="145" />
              <line x1="235" y1="64" x2="280" y2="138" />
              <line x1="280" y1="57" x2="325" y2="131" />
            </g>

            {/* Cabinet Depth Extrusion */}
            <line x1="90" y1="70" x2="60" y2="110" />
            <line x1="150" y1="170" x2="120" y2="210" />
            <line x1="390" y1="130" x2="360" y2="170" />
            <line x1="60" y1="110" x2="120" y2="210" />
            <line x1="120" y1="210" x2="360" y2="170" />

            {/* Rear Neck Bell / Flyback Core */}
            <path 
              d="M 60,110 L 30,120 L 70,170 L 120,210" 
              strokeDasharray="2 2" 
              stroke="#111111" 
              opacity="0.6" 
            />
            <circle cx="50" cy="140" r="14" stroke="#b31b1b" strokeWidth="1.2" strokeDasharray="2 1" />
            <text x="40" y="132" fontSize="6.5" fontFamily="'Space Mono', monospace" fill="#b31b1b" stroke="none" fontWeight="bold">HV</text>

            {/* Front Panel Control Deck / Knobs */}
            <g transform="translate(330, 60)">
              <circle cx="28" cy="18" r="6" stroke="#111111" strokeWidth="1.2" fill="#f4f1ea" />
              <line x1="28" y1="18" x2="32" y2="14" stroke="#084c78" strokeWidth="1.4" />
              <circle cx="24" cy="36" r="6" stroke="#111111" strokeWidth="1.2" fill="#f4f1ea" />
              <line x1="24" y1="36" x2="20" y2="33" stroke="#084c78" strokeWidth="1.4" />
              {/* Push Buttons */}
              <rect x="18" y="52" width="6" height="5" stroke="#111111" strokeWidth="1" fill="#111111" />
              <rect x="26" y="50" width="6" height="5" stroke="#111111" strokeWidth="1" fill="#111111" />
            </g>
          </g>

          {/* Technical Pointer Callouts */}
          <g stroke="#084c78" strokeWidth="1" fill="none" opacity="0.95">
            {/* Callout 01: Screen Tube */}
            <polyline points="230,105 270,90 310,90" />
            <circle cx="230" cy="105" r="2.2" fill="#084c78" />
            <text x="315" y="93" fontSize="7" fontFamily="'Space Mono', monospace" fill="#084c78" stroke="none" fontWeight="bold">
              [P1] 4:3 HIGH-FOCUS CRT TUBE
            </text>

            {/* Callout 02: Potentiometer Deck */}
            <polyline points="358,80 395,70 430,70" />
            <circle cx="358" cy="80" r="2.2" fill="#084c78" />
            <text x="400" y="63" fontSize="7" fontFamily="'Space Mono', monospace" fill="#084c78" stroke="none" fontWeight="bold">
              [P2] GAIN / VOL
            </text>

            {/* Callout 03: High Voltage Anode */}
            <polyline points="50,140 25,160 25,185" />
            <circle cx="50" cy="140" r="2.2" fill="#b31b1b" stroke="#b31b1b" />
            <text x="10" y="198" fontSize="7" fontFamily="'Space Mono', monospace" fill="#b31b1b" stroke="none" fontWeight="bold">
              [P3] 25kV ANODE
            </text>
          </g>
        </svg>
      </div>

      {/* Blueprint Footer Stamp Box */}
      <div className="border-2 border-[#084c78] p-2 flex items-center justify-between font-mono-tech text-[9px] bg-white/70">
        <div>
          <span className="text-[#084c78] font-bold">PLISTISMO BROADCAST R&D</span>
          <span className="text-[#333333] font-semibold block text-[8px]">CHASSIS ASSEMBLY CAD // DWG-CRT90-REV3</span>
        </div>
        <div className="text-right">
          <span className="text-[#b31b1b] font-bold">APPROVED QC-1996</span>
          <span className="text-[#333333] font-semibold block text-[8px]">SHEET 1 OF 1 • SCALE 1:5</span>
        </div>
      </div>
    </div>
  );
};
