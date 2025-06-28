
import React from 'react';

export const ContractSigningEffect = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated paper documents floating in background */}
      <div className="absolute top-20 left-10 animate-pulse opacity-10">
        <svg width="120" height="160" viewBox="0 0 120 160" className="text-white/20 transform rotate-12 animate-bounce" style={{ animationDuration: '8s' }}>
          <rect x="0" y="0" width="120" height="160" fill="currentColor" rx="8" />
          <rect x="15" y="20" width="90" height="2" fill="currentColor" opacity="0.6" />
          <rect x="15" y="35" width="70" height="2" fill="currentColor" opacity="0.6" />
          <rect x="15" y="50" width="85" height="2" fill="currentColor" opacity="0.6" />
          <rect x="15" y="65" width="60" height="2" fill="currentColor" opacity="0.6" />
          <rect x="15" y="80" width="80" height="2" fill="currentColor" opacity="0.6" />
          <rect x="15" y="95" width="75" height="2" fill="currentColor" opacity="0.6" />
          <rect x="15" y="130" width="40" height="8" fill="currentColor" opacity="0.8" rx="2" />
        </svg>
      </div>

      {/* Second floating document */}
      <div className="absolute top-40 right-20 animate-pulse opacity-8">
        <svg width="100" height="140" viewBox="0 0 100 140" className="text-blue-300/15 transform -rotate-6 animate-bounce" style={{ animationDuration: '12s', animationDelay: '2s' }}>
          <rect x="0" y="0" width="100" height="140" fill="currentColor" rx="6" />
          <rect x="12" y="18" width="76" height="2" fill="currentColor" opacity="0.7" />
          <rect x="12" y="30" width="60" height="2" fill="currentColor" opacity="0.7" />
          <rect x="12" y="42" width="70" height="2" fill="currentColor" opacity="0.7" />
          <rect x="12" y="54" width="50" height="2" fill="currentColor" opacity="0.7" />
          <rect x="12" y="66" width="65" height="2" fill="currentColor" opacity="0.7" />
          <rect x="12" y="110" width="35" height="6" fill="currentColor" opacity="0.9" rx="2" />
        </svg>
      </div>

      {/* Third document bottom left */}
      <div className="absolute bottom-32 left-20 animate-pulse opacity-6">
        <svg width="110" height="150" viewBox="0 0 110 150" className="text-purple-300/10 transform rotate-8 animate-bounce" style={{ animationDuration: '10s', animationDelay: '4s' }}>
          <rect x="0" y="0" width="110" height="150" fill="currentColor" rx="7" />
          <rect x="14" y="19" width="82" height="2" fill="currentColor" opacity="0.6" />
          <rect x="14" y="32" width="65" height="2" fill="currentColor" opacity="0.6" />
          <rect x="14" y="45" width="75" height="2" fill="currentColor" opacity="0.6" />
          <rect x="14" y="58" width="55" height="2" fill="currentColor" opacity="0.6" />
          <rect x="14" y="120" width="38" height="7" fill="currentColor" opacity="0.8" rx="2" />
        </svg>
      </div>

      {/* Animated hand signing effect */}
      <div className="absolute bottom-20 right-32 opacity-8">
        <div className="relative animate-pulse" style={{ animationDuration: '6s' }}>
          {/* Hand with pen */}
          <svg width="80" height="80" viewBox="0 0 80 80" className="text-white/15 transform rotate-45">
            {/* Pen */}
            <rect x="50" y="20" width="3" height="40" fill="currentColor" rx="1" />
            <circle cx="51.5" cy="18" r="2" fill="currentColor" />
            
            {/* Hand outline */}
            <path d="M35 35 Q40 30 45 35 Q50 40 45 45 Q40 50 35 45 Q30 40 35 35" fill="currentColor" opacity="0.6" />
            
            {/* Signature line being drawn */}
            <path d="M20 60 Q30 58 40 60 Q50 62 60 60" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none" 
                  opacity="0.8"
                  className="animate-pulse" />
          </svg>
          
          {/* Signature effect dots */}
          <div className="absolute top-12 left-8 w-1 h-1 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-14 left-12 w-1 h-1 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-16 left-16 w-1 h-1 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>

      {/* Floating signature elements */}
      <div className="absolute top-60 left-1/3 opacity-5">
        <div className="animate-float" style={{ animation: 'float 15s ease-in-out infinite' }}>
          <svg width="60" height="20" viewBox="0 0 60 20" className="text-cyan-300/20">
            <path d="M5 10 Q15 5 25 10 Q35 15 45 10 Q55 5 55 10" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none" />
          </svg>
        </div>
      </div>

      {/* Contract seal/stamp effect */}
      <div className="absolute top-80 right-1/4 opacity-8">
        <div className="animate-pulse" style={{ animationDuration: '8s', animationDelay: '3s' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" className="text-green-300/15">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M15 20 L18 23 L25 16" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Add custom keyframes for floating animation
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-10px) rotate(2deg); }
    50% { transform: translateY(-20px) rotate(0deg); }
    75% { transform: translateY(-10px) rotate(-2deg); }
  }
`;
document.head.appendChild(style);
