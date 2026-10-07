import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CentralKernelProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
}

export const CentralKernel: React.FC<CentralKernelProps> = ({ pointerPos }) => {
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const ring1GroupRef = useRef<THREE.Group>(null);
  const ring2GroupRef = useRef<THREE.Group>(null);

  // Stable ring geometry & line objects
  const { line1, line2 } = useMemo(() => {
    const pts = [];
    const count = 96;
    for (let i = 0; i <= count; i++) {
      const theta = (i / count) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);

    const mat1 = new THREE.LineBasicMaterial({
      color: '#8A867C',
      transparent: true,
      opacity: 0.28,
    });
    const mat2 = new THREE.LineBasicMaterial({
      color: '#B0ACA0',
      transparent: true,
      opacity: 0.22,
    });

    return {
      line1: new THREE.LineLoop(ringGeo, mat1),
      line2: new THREE.LineLoop(ringGeo.clone(), mat2),
    };
  }, []);

  useEffect(() => {
    return () => {
      line1.geometry.dispose();
      (line1.material as THREE.Material).dispose();
      line2.geometry.dispose();
      (line2.material as THREE.Material).dispose();
    };
  }, [line1, line2]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 28.0;
    const progress = (time / cycleDuration) % 1.0;

    const stateFloat = progress * 5.0;
    const currentStage = Math.floor(stateFloat);
    const localS = stateFloat - currentStage;
    const w = localS * localS * localS * (localS * (localS * 6.0 - 15.0) + 10.0);

    const s1 = new THREE.Vector3(0.75, 0.75, 0.75);
    const s2 = new THREE.Vector3(1.2, 1.2, 1.2);
    const s3 = new THREE.Vector3(0.7, 1.35, 0.7);
    const s4 = new THREE.Vector3(1.35, 0.55, 1.35);
    const s5 = new THREE.Vector3(0.82, 0.82, 0.82);

    let fromS: THREE.Vector3;
    let toS: THREE.Vector3;

    if (currentStage === 0) {
      fromS = s1; toS = s2;
    } else if (currentStage === 1) {
      fromS = s2; toS = s3;
    } else if (currentStage === 2) {
      fromS = s3; toS = s4;
    } else if (currentStage === 3) {
      fromS = s4; toS = s5;
    } else {
      fromS = s5; toS = s1;
    }

    const targetScale = new THREE.Vector3().lerpVectors(fromS, toS, w);
    const breath = 1.0 + 0.03 * Math.sin(time * 2.0);
    targetScale.multiplyScalar(breath);

    if (outerMeshRef.current) {
      outerMeshRef.current.scale.lerp(targetScale, 0.08);
      outerMeshRef.current.rotation.x = time * 0.12 + pointerPos.current.y * 0.2;
      outerMeshRef.current.rotation.y = time * 0.18 + pointerPos.current.x * 0.25;
      outerMeshRef.current.rotation.z = Math.sin(time * 0.1) * 0.2;
    }

    if (innerCoreRef.current) {
      const innerScale = targetScale.clone().multiplyScalar(0.5);
      innerCoreRef.current.scale.lerp(innerScale, 0.08);
      innerCoreRef.current.rotation.x = -time * 0.2;
      innerCoreRef.current.rotation.y = -time * 0.25;
    }

    if (ring1GroupRef.current) {
      ring1GroupRef.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.2) * 0.2;
      ring1GroupRef.current.rotation.y = time * 0.15;
      ring1GroupRef.current.scale.setScalar(targetScale.x * 1.55);
    }

    if (ring2GroupRef.current) {
      ring2GroupRef.current.rotation.y = Math.PI / 3 + time * 0.1;
      ring2GroupRef.current.rotation.z = Math.cos(time * 0.18) * 0.25;
      ring2GroupRef.current.scale.setScalar(targetScale.y * 1.65);
    }
  });

  return (
    <group>
      {/* Outer Frosted Optical Ceramic Kernel */}
      <mesh ref={outerMeshRef}>
        <icosahedronGeometry args={[0.9, 3]} />
        <meshPhysicalMaterial
          roughness={0.18}
          transmission={0.82}
          thickness={1.6}
          ior={1.48}
          color="#FAF8F5"
          attenuationColor="#F0ECE1"
          attenuationDistance={1.8}
          specularIntensity={0.8}
          clearcoat={0.3}
          transparent={true}
          opacity={0.88}
        />
      </mesh>

      {/* Inner Dense Cryptographic Core Node */}
      <mesh ref={innerCoreRef}>
        <dodecahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color="#222120"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Latitudinal Security Orbit Rings */}
      <group ref={ring1GroupRef}>
        <primitive object={line1} />
      </group>
      <group ref={ring2GroupRef}>
        <primitive object={line2} />
      </group>
    </group>
  );
};
