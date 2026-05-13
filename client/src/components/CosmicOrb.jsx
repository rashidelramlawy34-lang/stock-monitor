import { useState } from 'react';
import Spline from '@splinetool/react-spline';

const SCENE = 'https://prod.spline.design/BdKKLEJhJ4hvS3c0/scene.splinecode';

// Hub variant — zoomed in on orb, hand cropped out below
export default function CosmicOrb({ size = 320 }) {
  const [loaded, setLoaded] = useState(false);

  // Render Spline in a larger box, shifted up so the hand is below the clip boundary
  const inner = Math.round(size * 1.8);
  const shiftUp = Math.round(size * 0.60); // push scene up: crops hand from bottom

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>

      {/* CSS atmospheric halo */}
      <div style={{
        position: 'absolute',
        inset: '-60%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(140,180,255,0.48) 14%, rgba(124,92,255,0.58) 28%, rgba(80,40,200,0.28) 48%, rgba(40,20,120,0.10) 65%, transparent 80%)',
        filter: 'blur(38px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'orbPulse 3.5s ease-in-out infinite',
      }} />

      {/* Clipped + color-corrected Spline canvas */}
      <div style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
        borderRadius: '50%',
        zIndex: 1,
      }}>
        {/* Loading spinner */}
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(124,92,255,0.2)',
              borderTop: '2px solid #7c5cff',
              animation: 'spin 0.9s linear infinite',
            }} />
          </div>
        )}

        {/* Spline — oversized, shifted up to hide hand */}
        <div style={{
          width: inner, height: inner,
          position: 'absolute',
          left: -(inner - size) / 2,
          top:  -(inner - size) / 2 - shiftUp,
          // Hue-rotate shifts red/pink → purple/blue to match Aura palette
          filter: 'hue-rotate(215deg) saturate(1.6) brightness(1.1)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease',
        }}>
          <Spline
            scene={SCENE}
            onLoad={() => setLoaded(true)}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Purple/blue screen-blend overlay on top of hue-rotated result */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 46%, rgba(124,92,255,0.22) 0%, rgba(56,178,255,0.12) 50%, transparent 80%)',
          mixBlendMode: 'screen',
        }} />
      </div>
    </div>
  );
}
