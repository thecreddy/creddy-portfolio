import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FluidCoreKernelProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
}

export const FluidCoreKernel: React.FC<FluidCoreKernelProps> = ({ pointerPos }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerNodeRef = useRef<THREE.Mesh>(null);
  const kernelGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.LineLoop>(null);
  const ring2Ref = useRef<THREE.LineLoop>(null);

  // High-subdivision base geometry for organic procedural deformation
  const baseGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.85, 4);
  }, []);

  // Store original positions for deformation
  const originalPositions = useMemo(() => {
    return baseGeometry.attributes.position.array.slice() as Float32Array;
  }, [baseGeometry]);

  // Dynamic deformed geometry
  const deformedGeometry = useMemo(() => {
    return baseGeometry.clone();
  }, [baseGeometry]);

  // Orbit ring geometries
  const { line1, line2 } = useMemo(() => {
    const pts = [];
    const count = 96;
    for (let i = 0; i <= count; i++) {
      const theta = (i / count) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
    }
    const ringGeo1 = new THREE.BufferGeometry().setFromPoints(pts);
    const ringGeo2 = new THREE.BufferGeometry().setFromPoints(pts);

    const mat1 = new THREE.LineBasicMaterial({
      color: '#7A756D',
      transparent: true,
      opacity: 0.32,
    });
    const mat2 = new THREE.LineBasicMaterial({
      color: '#A8A49A',
      transparent: true,
      opacity: 0.24,
    });

    return {
      line1: new THREE.LineLoop(ringGeo1, mat1),
      line2: new THREE.LineLoop(ringGeo2, mat2),
    };
  }, []);

  useEffect(() => {
    return () => {
      baseGeometry.dispose();
      deformedGeometry.dispose();
      line1.geometry.dispose();
      (line1.material as THREE.Material).dispose();
      line2.geometry.dispose();
      (line2.material as THREE.Material).dispose();
    };
  }, [baseGeometry, deformedGeometry, line1, line2]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 30.0;
    const phi = (time / cycleDuration) * Math.PI * 2;

    // Harmonic expansion and vortex modulation
    const expansionWeight = 0.5 - 0.5 * Math.cos(phi);
    const vortexWeight = Math.max(0, Math.sin(phi - 1.2) * 1.3);

    // Procedural surface deformation (organic liquid computation)
    const posAttr = deformedGeometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const vertexCount = originalPositions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const ox = originalPositions[i * 3];
      const oy = originalPositions[i * 3 + 1];
      const oz = originalPositions[i * 3 + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      // 3D spherical harmonic undulation + travelling fluid ripples
      const ripple1 = Math.sin(nx * 4.0 + time * 1.6) * Math.cos(ny * 4.0 + time * 1.2);
      const ripple2 = Math.sin(nz * 5.0 + ny * 3.0 + time * 2.0) * 0.5;
      const vortexTorque = vortexWeight * Math.sin(nx * 2.0 + nz * 2.0 + time * 2.5) * 0.45;

      const disp = 1.0 + 0.15 * (ripple1 + ripple2) + vortexTorque;

      // Morphed scale per state
      const scaleX = (1.0 + 0.35 * expansionWeight - 0.2 * vortexWeight) * disp;
      const scaleY = (1.0 - 0.25 * expansionWeight + 0.3 * vortexWeight) * disp;
      const scaleZ = (1.0 + 0.35 * expansionWeight - 0.2 * vortexWeight) * disp;

      posArray[i * 3] = ox * scaleX;
      posArray[i * 3 + 1] = oy * scaleY;
      posArray[i * 3 + 2] = oz * scaleZ;
    }

    posAttr.needsUpdate = true;
    deformedGeometry.computeVertexNormals();

    // Subtle pointer parallax (NO rigid continuous rotation!)
    if (kernelGroupRef.current) {
      kernelGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        kernelGroupRef.current.rotation.y,
        pointerPos.current.x * 0.18,
        0.04
      );
      kernelGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        kernelGroupRef.current.rotation.x,
        -pointerPos.current.y * 0.12,
        0.04
      );
    }

    // Inner node rhythmic breathing
    if (innerNodeRef.current) {
      const innerScale = 0.38 + 0.05 * Math.sin(time * 2.5);
      innerNodeRef.current.scale.setScalar(innerScale);
      innerNodeRef.current.rotation.y = time * 0.2;
    }

    // Latitudinal orbit rings with wave breathing
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.3) * 0.15;
      ring1Ref.current.rotation.z = time * 0.08;
      const rScale = (1.15 + 0.45 * expansionWeight) * (1.0 + 0.03 * Math.sin(time * 2.0));
      ring1Ref.current.scale.setScalar(rScale);
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = Math.PI / 3 + time * 0.06;
      ring2Ref.current.rotation.x = Math.cos(time * 0.25) * 0.2;
      const rScale = (1.25 + 0.55 * expansionWeight) * (1.0 + 0.03 * Math.cos(time * 2.2));
      ring2Ref.current.scale.setScalar(rScale);
    }
  });

  return (
    <group ref={kernelGroupRef}>
      {/* Deforming Organic Frosted Liquid-Matter Kernel */}
      <mesh ref={meshRef} geometry={deformedGeometry}>
        <meshPhysicalMaterial
          roughness={0.2}
          transmission={0.84}
          thickness={1.5}
          ior={1.46}
          color="#FAF8F5"
          attenuationColor="#EFECE3"
          attenuationDistance={1.6}
          specularIntensity={0.85}
          clearcoat={0.35}
          transparent={true}
          opacity={0.88}
        />
      </mesh>

      {/* Internal Cryptographic AI Nucleus */}
      <mesh ref={innerNodeRef}>
        <dodecahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color="#1E1D1C"
          roughness={0.28}
          metalness={0.85}
        />
      </mesh>

      {/* Dynamic Wave Security Rings */}
      <primitive ref={ring1Ref} object={line1} />
      <primitive ref={ring2Ref} object={line2} />
    </group>
  );
};

