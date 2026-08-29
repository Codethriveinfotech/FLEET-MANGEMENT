import React from 'react';
import { Platform } from 'react-native';

export default function ThreeDVehicle() {
  if (Platform.OS !== 'web') {
    return null;
  }

  // Pure CSS 3D vehicle styling rules injected into the document
  const css = `
    @keyframes spin3d {
      0% { transform: rotateY(0deg) rotateX(-20deg) rotateZ(0deg); }
      100% { transform: rotateY(360deg) rotateX(-20deg) rotateZ(0deg); }
    }
    .scene-3d {
      width: 100%;
      height: 200px;
      perspective: 800px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle, rgba(29,78,216,0.08) 0%, rgba(255,255,255,0) 70%);
      overflow: hidden;
      position: relative;
    }
    .vehicle-3d {
      width: 120px;
      height: 60px;
      transform-style: preserve-3d;
      animation: spin3d 10s linear infinite;
      position: relative;
    }
    
    /* 3D Cube / Face Helper */
    .face {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Main Chassis */
    .chassis-front  { width: 30px; height: 35px; transform: rotateY(90deg) translateZ(60px); background: #1D4ED8; }
    .chassis-back   { width: 30px; height: 35px; transform: rotateY(-90deg) translateZ(60px); background: #1E3A8A; }
    .chassis-left   { width: 120px; height: 35px; transform: rotateY(0deg) translateZ(15px); background: #2563EB; }
    .chassis-right  { width: 120px; height: 35px; transform: rotateY(180deg) translateZ(15px); background: #1D4ED8; }
    .chassis-top    { width: 120px; height: 30px; transform: rotateX(90deg) translateZ(15px); background: #3B82F6; }
    .chassis-bottom { width: 120px; height: 30px; transform: rotateX(-90deg) translateZ(20px); background: #0F172A; box-shadow: 0 0 25px 5px rgba(0, 240, 255, 0.4); }

    /* Cabin / Windshield */
    .cabin-front  { width: 30px; height: 20px; transform: rotateY(90deg) translateZ(20px); background: rgba(14, 165, 233, 0.8); backdrop-filter: blur(2px); }
    .cabin-back   { width: 30px; height: 20px; transform: rotateY(-90deg) translateZ(20px); background: #1D4ED8; }
    .cabin-left   { width: 40px; height: 20px; transform: rotateY(0deg) translateZ(15px); background: rgba(59, 130, 246, 0.9); }
    .cabin-right  { width: 40px; height: 20px; transform: rotateY(180deg) translateZ(15px); background: #1D4ED8; }
    .cabin-top    { width: 40px; height: 30px; transform: rotateX(90deg) translateZ(10px); background: #60A5FA; }

    /* Wheels */
    .wheel {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #1E293B;
      border: 3px solid #64748B;
      position: absolute;
      transform-style: preserve-3d;
    }
    .wheel-fl { transform: translate3d(20px, 22px, 16px) rotateY(0deg); }
    .wheel-fr { transform: translate3d(20px, 22px, -16px) rotateY(180deg); }
    .wheel-rl { transform: translate3d(80px, 22px, 16px) rotateY(0deg); }
    .wheel-rr { transform: translate3d(80px, 22px, -16px) rotateY(180deg); }

    /* Inner Rim effect */
    .wheel::after {
      content: '';
      position: absolute;
      top: 5px;
      left: 5px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00F0FF;
      box-shadow: 0 0 8px #00F0FF;
    }
  `;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="scene-3d">
        {/* Holographic Radar Circle */}
        <div style={{
          position: 'absolute',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          border: '1.5px dashed rgba(0, 240, 255, 0.25)',
          transform: 'rotateX(75deg) translateZ(-20px)',
          animation: 'spin3d 25s linear infinite'
        }} />
        
        <div className="vehicle-3d">
          {/* Main Chassis group */}
          <div className="face chassis-front"></div>
          <div className="face chassis-back"></div>
          <div className="face chassis-left"></div>
          <div className="face chassis-right"></div>
          <div className="face chassis-top"></div>
          <div className="face chassis-bottom"></div>

          {/* Cabin group (Offset to the front side of chassis) */}
          <div style={{ transform: 'translate3d(10px, -20px, 0px)', transformStyle: 'preserve-3d', position: 'absolute' }}>
            <div className="face cabin-front"></div>
            <div className="face cabin-back"></div>
            <div className="face cabin-left"></div>
            <div className="face cabin-right"></div>
            <div className="face cabin-top"></div>
          </div>

          {/* Wheels */}
          <div className="wheel wheel-fl"></div>
          <div className="wheel wheel-fr"></div>
          <div className="wheel wheel-rl"></div>
          <div className="wheel wheel-rr"></div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#00F0FF',
          boxShadow: '0 0 8px #00F0FF',
          display: 'inline-block'
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: 0.5 }}>
          LIVE 3D DIGITAL TWIN
        </span>
      </div>
    </div>
  );
}
