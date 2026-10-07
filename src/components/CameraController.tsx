import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
  isMobile: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({ pointerPos, isMobile }) => {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 5.4));

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 30.0;
    const phi = (time / cycleDuration) * Math.PI * 2;

    // Harmonized expansion for push-in / pull-out
    const expansionWeight = 0.5 - 0.5 * Math.cos(phi);

    // Mobile distance compensation
    const distMultiplier = isMobile ? 1.45 : 1.0;

    // Cinematic continuous orbital path (never rigid, organic perspective drift)
    const orbitAngle = time * 0.045;
    const baseX = Math.sin(orbitAngle) * 0.45;
    const baseY = Math.sin(orbitAngle * 0.7) * 0.25;
    const baseZ = (5.2 + 0.65 * expansionWeight + 0.25 * Math.cos(orbitAngle)) * distMultiplier;

    // Mouse parallax offset (smooth, restrained)
    const parallaxX = pointerPos.current.x * (isMobile ? 0.2 : 0.42);
    const parallaxY = pointerPos.current.y * (isMobile ? 0.15 : 0.32);

    targetCamPos.current.set(
      baseX + parallaxX,
      baseY + parallaxY,
      baseZ
    );

    // Viscous physical damping
    camera.position.lerp(targetCamPos.current, 0.04);

    // Dynamic lookAt: tracks subtle focal breathing
    const targetLook = new THREE.Vector3(
      pointerPos.current.x * 0.12,
      pointerPos.current.y * 0.08,
      0
    );
    currentLookAt.current.lerp(targetLook, 0.04);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
