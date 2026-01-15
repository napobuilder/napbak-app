import React, { useState, useEffect, useMemo } from 'react';

interface LoadingScreenProps {
  progress: number;
}

// Mensajes divertidos que rotan durante la carga
const LOADING_MESSAGES = [
  "Calentando los pads...",
  "Afinando las melodías...",
  "Cargando el flow...",
  "Preparando el sauce...",
  "Conectando con el beat...",
  "Despertando el bajo...",
  "Ajustando los hi-hats...",
  "Activando modo creativo...",
  "Cocinando el ritmo...",
  "Cargando la vibra...",
];

// Componente de partícula musical
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'note' | 'circle' | 'dot';
}

const MusicParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const symbols = {
    note: '♪',
    circle: '○',
    dot: '●',
  };

  return (
    <div
      className="absolute text-green-500/30 animate-float pointer-events-none select-none"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        fontSize: `${particle.size}px`,
        animationDuration: `${particle.duration}s`,
        animationDelay: `${particle.delay}s`,
      }}
    >
      {symbols[particle.type]}
    </div>
  );
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Generar partículas una sola vez
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 14,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
      type: (['note', 'circle', 'dot'] as const)[Math.floor(Math.random() * 3)],
    }));
  }, []);

  // Rotar mensajes cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animación de salida cuando llega al 100%
  useEffect(() => {
    if (progress >= 100) {
      setIsExiting(true);
    }
  }, [progress]);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#0a0a0a]" />
      
      {/* Resplandor verde detrás del logo */}
      <div className="absolute w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      
      {/* Partículas musicales */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <MusicParticle key={particle.id} particle={particle} />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 text-center">
        {/* Logo con animación de pulso */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-ping-slow" />
          <img 
            src="/napbak app.png" 
            alt="Napbak Logo" 
            className="w-28 h-28 mx-auto rounded-full shadow-2xl shadow-green-500/20 object-contain animate-pulse-subtle relative z-10 border-2 border-green-500/30" 
          />
        </div>

        {/* Título */}
        <h1 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent">
          NAPBAK
        </h1>
        <p className="text-green-500/80 text-sm font-medium tracking-widest mb-8">
          BEAT MAKER
        </p>

        {/* Mensaje rotativo */}
        <div className="h-8 mb-6">
          <p 
            key={currentMessageIndex}
            className="text-gray-400 text-lg animate-fade-in"
          >
            {LOADING_MESSAGES[currentMessageIndex]}
          </p>
        </div>

        {/* Barra de progreso estilizada */}
        <div className="w-72 mx-auto">
          <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
            {/* Brillo animado en el fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer" />
            
            {/* Barra de progreso */}
            <div 
              className="h-full bg-gradient-to-r from-green-600 via-green-400 to-green-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Brillo en la barra */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          
          {/* Porcentaje */}
          <p className="text-green-500 text-sm font-mono mt-3 tabular-nums">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* Línea decorativa inferior */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 text-gray-600 text-xs">
          <span className="w-8 h-px bg-gray-700" />
          <span>Make beats, not excuses</span>
          <span className="w-8 h-px bg-gray-700" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
