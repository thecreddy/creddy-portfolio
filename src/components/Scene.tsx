import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { NeuralParticles } from './NeuralParticles';
import { DynamicNeuralMatter } from './DynamicNeuralMatter';
import { CameraController } from './CameraController';
import { FallbackVisual } from './FallbackVisual';
import { ErrorBoundary } from './ErrorBoundary';
import { isWebGLAvailable } from '../utils/webgl';

interface SceneProps {
  isMobile: boolean;
}

export const Scene: React.FC<SceneProps> = ({ isMobile }) => {
  const pointerPos = useRef({ x: 0, y: 0 });
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());

    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointerPos.current = { x, y };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const x = (touch.clientX / window.innerWidth) * 2 - 1;
        const y = -(touch.clientY / window.innerHeight) * 2 + 1;
        pointerPos.current = { x, y };
      }
    };

    const handlePointerLeave = () => {
      pointerPos.current = { x: 0, y: 0 };
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, []);

  // Position offset: desktop places 3D visual comfortably on the right side away from paragraph text
  const scenePosition: [number, number, number] = isMobile ? [0, -0.32, 0] : [1.85, 0, 0];
  const sceneScale = isMobile ? 0.78 : 1.02;

  if (!hasWebGL) {
    return <FallbackVisual isMobile={isMobile} />;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <ErrorBoundary fallback={<FallbackVisual isMobile={isMobile} />}>
        <Canvas
          camera={{ position: [0, 0, 5.6], fov: isMobile ? 48 : 42 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
          frameloop={isTabVisible ? 'always' : 'never'}
        >
          <CameraController pointerPos={pointerPos} isMobile={isMobile} />

          {/* Soft Studio Lighting */}
          <ambientLight color="#FAF9F6" intensity={1.25} />
          <directionalLight position={[6, 8, 5]} intensity={1.85} color="#FFFFFF" />
          <directionalLight position={[-6, -3, -4]} intensity={0.85} color="#EBE7DE" />
          <pointLight position={[0, 0, 0]} intensity={0.35} color="#FFFDF7" distance={4} />

          {/* Continuously Evolving 3D AI Core Centerpiece */}
          <group position={scenePosition} scale={sceneScale}>
            <DynamicNeuralMatter pointerPos={pointerPos} />
            <NeuralParticles pointerPos={pointerPos} isLowPower={prefersReducedMotion} />
          </group>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};
