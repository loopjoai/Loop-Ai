import React, { useState, useRef, useEffect } from 'react';
import { AdConcept, LogoPosition } from '../types';

interface CreativePreviewProps {
  concept: AdConcept;
  productImage: string | null;
  logoImage: string | null;
  generatedImage?: string | null;
  className?: string;
  logoPosition?: LogoPosition;
  onLogoMove?: (pos: LogoPosition) => void;
}

// Draggable Logo Component
const DraggableLogo = ({ 
  src, 
  position, 
  onMove, 
  containerRef 
}: { 
  src: string; 
  position: LogoPosition; 
  onMove?: (pos: LogoPosition) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onMove) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    
    // Capture pointer to track movement even if mouse leaves the element
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !onMove || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate new position as percentage relative to container
    // We center the drag on the pointer
    let newX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    let newY = ((e.clientY - containerRect.top) / containerRect.height) * 100;

    // Clamp values (keeping logo roughly inside)
    newX = Math.max(0, Math.min(90, newX)); 
    newY = Math.max(0, Math.min(90, newY));

    onMove({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`absolute z-20 w-[14%] min-w-[45px] max-w-[70px] transition-transform duration-75 ${onMove ? 'cursor-move touch-none' : ''}`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
       <img 
         src={src} 
         alt="Brand Logo" 
         className="w-full h-auto object-contain drop-shadow-md select-none pointer-events-none" 
         style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
       />
       {onMove && (
         <div className="absolute inset-0 border border-transparent hover:border-blue-400 rounded-lg transition-colors"></div>
       )}
    </div>
  );
};

// Internal Component: The content of the ad
const AdContent = ({ concept, productImage, logoImage, generatedImage, logoPosition, onLogoMove }: CreativePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default position if not provided
  const activePos = logoPosition || { x: 6, y: 4 };

  if (generatedImage) {
    return (
      <div className="w-full h-full relative bg-gray-900">
        <img 
          src={generatedImage} 
          alt="AI Generated Ad" 
          className="w-full h-full object-cover pointer-events-none select-none"
        />
        {/* Helper Badge */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[8px] text-white/80 uppercase tracking-widest border border-white/10 z-10">
          High-Res AI
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-900 overflow-hidden select-none group/preview">
       {/* Background Layer */}
       <div 
        className="absolute inset-0 z-0"
        style={{ 
          background: `linear-gradient(135deg, ${concept.colorHex} 0%, #111827 100%)` 
        }}
      />
      <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col p-6 pointer-events-none">
        
        {/* Main Product Area */}
        <div className="flex-grow flex items-center justify-center relative my-4">
            <div className="absolute w-[60%] aspect-square bg-white/20 blur-[60px] rounded-full"></div>
            {productImage ? (
              <img 
                src={productImage} 
                alt="Product" 
                className="relative max-w-[85%] max-h-[60%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover/preview:scale-105" 
              />
            ) : (
              <div className="w-40 h-40 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                <span className="text-gray-500 text-xs">No Product</span>
              </div>
            )}
        </div>

        {/* Text Area */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl mt-auto pointer-events-auto">
           <h3 className="text-lg font-bold text-white mb-1.5 leading-tight">{concept.headline}</h3>
           <p className="text-[10px] text-gray-200 mb-3 line-clamp-2 leading-relaxed">{concept.primaryText}</p>
           <button 
             className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-lg"
             style={{ backgroundColor: concept.colorHex, color: '#fff', filter: 'brightness(1.2)' }}
           >
             {concept.cta}
           </button>
        </div>
      </div>
      
      {/* Draggable Logo Layer (Outside the flex column so it doesn't affect flow) */}
      {logoImage && (
         <div className="absolute inset-0 z-30 pointer-events-auto">
            <DraggableLogo 
               src={logoImage} 
               position={activePos} 
               onMove={onLogoMove} 
               containerRef={containerRef}
            />
         </div>
      )}
      
      {/* Vibe Badge */}
      <div className="absolute top-4 right-4 text-[9px] text-white/50 uppercase tracking-widest font-medium z-10 pointer-events-none">
        {concept.designVibe}
      </div>
    </div>
  );
};

// Internal Component: The Modal Lightbox
interface LightboxModalProps {
  onClose: () => void;
  children?: React.ReactNode;
}

const LightboxModal = ({ onClose, children }: LightboxModalProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(1, scale + delta), 4);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 z-50">
        <h3 className="text-white font-medium">Preview Mode</h3>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div 
        className="flex-grow overflow-hidden flex items-center justify-center relative cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={containerRef}
      >
        <div 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            width: '100%',
            height: '100%',
            maxWidth: '500px',
            maxHeight: '800px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="p-4"
        >
          <div className="w-full h-full shadow-2xl relative">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CreativePreview: React.FC<CreativePreviewProps> = (props) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <div className={`relative group overflow-hidden shadow-2xl rounded-2xl border border-gray-700 bg-gray-900 ${props.className}`}>
        <AdContent {...props} />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
           <button 
             onClick={() => setIsLightboxOpen(true)}
             className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 rounded-full p-4 shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-200"
             title="Expand Preview"
           >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
             </svg>
           </button>
        </div>
      </div>

      {isLightboxOpen && (
        <LightboxModal onClose={() => setIsLightboxOpen(false)}>
           <AdContent {...props} />
        </LightboxModal>
      )}
    </>
  );
};