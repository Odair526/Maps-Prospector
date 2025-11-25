
import React, { useEffect, useState, useRef } from 'react';

interface RobotMascotProps {
  state: 'IDLE' | 'SEARCHING' | 'RESULTS' | 'ERROR';
}

const SEARCH_MESSAGES = [
  "Calibrando sensores...",
  "Conectando aos satélites...",
  "Varrendo o Google Maps...",
  "Filtrando empresas qualificadas...",
  "Buscando redes sociais...",
  "Verificando presença digital...",
  "Analisando avaliações...",
  "Compilando os melhores leads...",
  "Quase pronto..."
];

export const RobotMascot: React.FC<RobotMascotProps> = ({ state }) => {
  const isSearching = state === 'SEARCHING';
  const isError = state === 'ERROR';
  const isResults = state === 'RESULTS';
  const isIdle = state === 'IDLE';

  // Refs for mouse tracking
  const targetMousePos = useRef({ x: 0, y: 0 });
  
  // State for smoothed position
  const [smoothMousePos, setSmoothMousePos] = useState({ x: 0, y: 0 });
  
  // Breathing/Idle animation time reference
  const timeRef = useRef(0);
  
  // Dynamic message state
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      targetMousePos.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      timeRef.current += 0.05; // Increment time for sine waves

      setSmoothMousePos(prev => {
        const target = targetMousePos.current;
        const lerpFactor = 0.08; // Softer lag for more "weight"
        
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        
        // Add a subtle idle sway (breathing effect) to the position
        const swayX = Math.sin(timeRef.current * 0.5) * 0.05;
        const swayY = Math.cos(timeRef.current * 0.5) * 0.05;

        return {
          x: prev.x + (dx * lerpFactor) + (isIdle ? swayX * 0.02 : 0),
          y: prev.y + (dy * lerpFactor) + (isIdle ? swayY * 0.02 : 0)
        };
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isIdle]);

  // Message Rotation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSearching) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % SEARCH_MESSAGES.length);
      }, 3000); 
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Calculated Rotation Values
  const rotateY = smoothMousePos.x * 35; 
  const rotateX = -smoothMousePos.y * 20;
  const eyeOffsetX = smoothMousePos.x * 12;
  const eyeOffsetY = smoothMousePos.y * 12;

  // Determine message
  let currentMessage = "Olá! Vamos prospectar?";
  if (isSearching) currentMessage = SEARCH_MESSAGES[messageIndex];
  if (isResults) currentMessage = "Missão cumprida! Veja o que encontrei.";
  if (isError) currentMessage = "Ops, encontrei um problema.";

  return (
    <div className="relative w-64 h-64 mx-auto mb-10" style={{ perspective: '1200px' }}>
      
      {/* 
        SPEECH BUBBLE 
        - Mobile: Top Centered
        - Desktop (md): Right Side
      */}
      <div 
        className={`absolute z-50 transition-all duration-500 ease-out
          -top-28 left-1/2 -translate-x-1/2  /* Mobile Position */
          md:top-8 md:left-[85%] md:translate-x-0 /* Desktop Position */
        `}
      >
        <div 
          className={`
            relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-6 py-4 
            border border-blue-100 min-w-[200px] max-w-[280px] text-center md:text-left
            transition-all duration-300
            ${isSearching ? 'scale-105 border-blue-400 shadow-blue-200/50' : 'scale-100 border-gray-200'}
          `}
          style={{
            marginTop: smoothMousePos.y * -15 // Parallax effect via margin to avoid transform conflicts
          }}
        >
          <p className="text-sm font-bold text-gray-700 leading-snug">
             {currentMessage}
          </p>
          {isSearching && (
            <div className="flex justify-center md:justify-start gap-1 mt-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
            </div>
          )}
          
          {/* Bubble Tail */}
          <div className={`
             absolute w-4 h-4 bg-white/95 border-blue-100 transform rotate-45
             -bottom-2 left-1/2 -translate-x-1/2 border-b border-r /* Mobile: Point Down */
             md:top-6 md:-left-2 md:bottom-auto md:translate-x-0 md:border-b md:border-l md:border-r-0 /* Desktop: Point Left */
          `}></div>
        </div>
      </div>

      {/* Floor Shadow (Dynamic scaling) */}
      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-32 h-6 bg-black/10 blur-xl rounded-[100%] animate-shadow-pulse"></div>

      {/* Holographic Floor (Searching Only) */}
      {isSearching && (
         <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-48 h-16 bg-blue-500/20 blur-xl rounded-[100%] animate-pulse pointer-events-none"></div>
      )}

      {/* ROBOT SVG */}
      <div className={`w-full h-full transition-transform duration-500 ease-out animate-float`}>
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            {/* Improved Gradients for Glossy 3D Look */}
            <radialGradient id="bodyGradient" cx="35%" cy="35%" r="85%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#64748b" />
            </radialGradient>
            
            <linearGradient id="blueMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <radialGradient id="screenGradient" cx="50%" cy="50%" r="50%">
               <stop offset="80%" stopColor="#0f172a" />
               <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>
            
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="3" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* --- BODY --- */}
          {/* Rotate body slightly less than head for weight */}
          <g transform={`translate(200, 280) rotate(${rotateY * 0.15})`}>
             <path d="M -60 -60 C -65 -10, -45 85, 0 95 C 45 85, 65 -10, 60 -60 Z" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1"/>
             
             {/* Chest Light */}
             <circle cx="0" cy="-10" r="28" fill="#e0f2fe" stroke="#bfdbfe" strokeWidth="2" />
             <circle cx="0" cy="-10" r="18" fill="#3b82f6" className={isSearching ? "animate-pulse" : ""} filter="url(#glow)"/>
             {/* Reflection on chest */}
             <path d="M -10 -20 Q 0 -25 10 -20" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          </g>

          {/* --- ARMS --- */}
          {/* Arms have inertia (rotate slightly opposite or lag) */}
          
          {/* SEARCHING POSE (Clipboard) */}
          {isSearching && (
            <>
              {/* Left Arm */}
              <g transform={`translate(135, 260) rotate(${20 + rotateY * 0.05})`}>
                <ellipse cx="0" cy="0" rx="16" ry="42" fill="url(#bodyGradient)" stroke="#94a3b8" />
                <circle cx="0" cy="40" r="13" fill="url(#bodyGradient)" />
              </g>
              {/* Clipboard */}
              <g transform={`translate(${145 + rotateY * 0.1}, 295) rotate(-5)`}>
                <rect x="-35" y="-45" width="70" height="90" rx="6" fill="#f8fafc" stroke="#64748b" />
                <rect x="-25" y="-40" width="50" height="10" rx="2" fill="#3b82f6" />
                {/* Lines */}
                <line x1="-20" y1="-15" x2="20" y2="-15" stroke="#cbd5e1" strokeWidth="3" />
                <line x1="-20" y1="5" x2="20" y2="5" stroke="#cbd5e1" strokeWidth="3" />
                <line x1="-20" y1="25" x2="10" y2="25" stroke="#cbd5e1" strokeWidth="3" />
                <path d="M -28 -15 L -24 -15 L -22 -18" stroke="#22c55e" strokeWidth="2" fill="none" />
                <path d="M -28 5 L -24 5 L -22 2" stroke="#22c55e" strokeWidth="2" fill="none" />
              </g>

              {/* Right Arm (Writing) */}
              <g transform={`translate(265, 260) rotate(${-30 + rotateY * 0.05})`}>
                 <ellipse cx="0" cy="0" rx="16" ry="42" fill="url(#bodyGradient)" stroke="#94a3b8" />
                 <circle cx="0" cy="40" r="13" fill="url(#bodyGradient)" />
                 {/* Pen */}
                 <rect x="-6" y="30" width="12" height="45" rx="2" fill="#334155" transform="rotate(45)" />
              </g>
            </>
          )}

          {/* RESULTS POSE (Trophy) */}
          {isResults && (
             <>
               <g transform={`translate(140, 250) rotate(${35 + rotateY * 0.05})`}>
                  <ellipse cx="0" cy="0" rx="16" ry="45" fill="url(#bodyGradient)" stroke="#94a3b8" />
                  <circle cx="0" cy="45" r="13" fill="url(#bodyGradient)" />
               </g>
               <g transform={`translate(260, 250) rotate(${-35 + rotateY * 0.05})`}>
                  <ellipse cx="0" cy="0" rx="16" ry="45" fill="url(#bodyGradient)" stroke="#94a3b8" />
                  <circle cx="0" cy="45" r="13" fill="url(#bodyGradient)" />
               </g>
               {/* Trophy */}
               <g transform={`translate(${200 + rotateY * 0.1}, 270) rotate(${rotateY * 0.1})`}>
                  <path d="M -25 0 L -20 40 C -20 55, 20 55, 20 40 L 25 0 Z" fill="url(#goldGradient)" />
                  <ellipse cx="0" cy="0" rx="25" ry="8" fill="#fbbf24" />
                  <path d="M -25 10 C -35 10, -35 30, -22 30" fill="none" stroke="#f59e0b" strokeWidth="4" />
                  <path d="M 25 10 C 35 10, 35 30, 22 30" fill="none" stroke="#f59e0b" strokeWidth="4" />
                  <rect x="-15" y="50" width="30" height="8" fill="#78350f" rx="2" />
                  <path d="M -20 58 L 20 58 L 25 68 L -25 68 Z" fill="#1e293b" />
                  <path transform="translate(0, 25) scale(0.6)" d="M 0 -10 L 2.5 -2.5 L 10 -2.5 L 4 2.5 L 6 10 L 0 5 L -6 10 L -4 2.5 L -10 -2.5 L -2.5 -2.5 Z" fill="#fff" filter="url(#glow)" />
               </g>
             </>
          )}

          {/* IDLE POSE */}
          {(isIdle || isError) && (
            <>
              <g transform={`translate(${130 + smoothMousePos.x * 8}, ${240 + smoothMousePos.y * 5}) rotate(${15 + rotateY * 0.1})`}> 
                 <ellipse cx="0" cy="0" rx="20" ry="38" transform="rotate(25)" fill="url(#bodyGradient)" stroke="#94a3b8" />
                 <circle cx="-12" cy="25" r="11" fill="url(#blueMetal)" />
              </g>
               <g transform={`translate(${270 - smoothMousePos.x * 8}, ${240 + smoothMousePos.y * 5}) rotate(${-15 + rotateY * 0.1})`}> 
                 <ellipse cx="0" cy="0" rx="20" ry="38" transform="rotate(-25)" fill="url(#bodyGradient)" stroke="#94a3b8" />
                 <circle cx="12" cy="25" r="11" fill="url(#blueMetal)" />
              </g>
            </>
          )}


          {/* --- HEAD --- */}
          {/* Head Tilt + Rotation */}
          <g transform={`translate(200, 140) rotate(${rotateY * 0.4}) skewX(${rotateX * 0.08})`}>
            
            {/* Antennas (With physics sway) */}
            <g transform={`rotate(${-rotateY * 0.2})`}> 
               {/* Left */}
               <path d="M -60 -75 Q -80 -100 -90 -110" stroke="#94a3b8" strokeWidth="4" fill="none" />
               <circle cx="-90" cy="-110" r="6" fill="#3b82f6" className={isSearching ? "animate-pulse" : ""} />
               {/* Right */}
               <path d="M 60 -75 Q 80 -100 90 -110" stroke="#94a3b8" strokeWidth="4" fill="none" />
               <circle cx="90" cy="-110" r="6" fill="#3b82f6" className={isSearching ? "animate-pulse" : ""} />
            </g>

            {/* Head Shape */}
            <rect x="-90" y="-85" width="180" height="145" rx="55" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Ears */}
            <g transform="translate(-105, -15)">
              <rect x="-15" y="-30" width="30" height="60" rx="15" fill="url(#blueMetal)" stroke="#2563eb" strokeWidth="1" />
            </g>
            <g transform="translate(105, -15)">
              <rect x="-15" y="-30" width="30" height="60" rx="15" fill="url(#blueMetal)" stroke="#2563eb" strokeWidth="1" />
            </g>

            {/* Face Screen */}
            <rect x="-70" y="-55" width="140" height="95" rx="28" fill="url(#screenGradient)" stroke="#334155" strokeWidth="3" />
            
            {/* Screen Reflection */}
            <path d="M -50 -40 Q 0 -50 50 -40" stroke="white" strokeWidth="3" opacity="0.1" fill="none" />

            {/* EYES */}
            <g transform={`translate(${eyeOffsetX}, ${eyeOffsetY})`}>
              {isError ? (
                 <g stroke="#ef4444" strokeWidth="6" strokeLinecap="round">
                   <path d="M -40 -10 L -20 10 M -20 -10 L -40 10" filter="url(#glow)" />
                   <path d="M 20 -10 L 40 10 M 40 -10 L 20 10" filter="url(#glow)" />
                 </g>
              ) : (isResults) ? (
                 <g stroke="#22c55e" strokeWidth="6" strokeLinecap="round" fill="none">
                    <path d="M -45 5 Q -30 -15 -15 5" filter="url(#glow)" />
                    <path d="M 15 5 Q 30 -15 45 5" filter="url(#glow)" />
                 </g>
              ) : (
                <g fill={isSearching ? "#60a5fa" : "#3b82f6"} filter="url(#glow)">
                  <rect x="-50" y="-18" width="36" height="48" rx="14" className={isSearching ? "animate-pulse" : "animate-blink"} />
                  <rect x="14" y="-18" width="36" height="48" rx="14" className={isSearching ? "animate-pulse" : "animate-blink"} />
                  {/* Eye Glare */}
                  <circle cx="-38" cy="-8" r="6" fill="white" opacity="0.9" />
                  <circle cx="26" cy="-8" r="6" fill="white" opacity="0.9" />
                </g>
              )}
            </g>

            {/* Mouth (Searching state) */}
            {isSearching && (
              <g transform="translate(0, 30)">
                 <rect x="-15" y="0" width="30" height="4" rx="2" fill="#3b82f6" opacity="0.6" className="animate-ping" />
              </g>
            )}
          </g>
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: translate(-50%, 0) scaleX(1); opacity: 0.1; }
          50% { transform: translate(-50%, 0) scaleX(0.8); opacity: 0.05; }
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-shadow-pulse {
          animation: shadow-pulse 4s ease-in-out infinite;
        }
        .animate-blink {
          animation: blink 4s infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};
