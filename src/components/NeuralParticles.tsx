import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { neuralVertexShader, neuralFragmentShader } from '../shaders/neuralShaders';

interface NeuralParticlesProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
  isLowPower?: boolean;
}

export const NeuralParticles: React.FC<NeuralParticlesProps> = ({ pointerPos, isLowPower = false }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const count = useMemo(() => (isLowPower ? 14000 : 25000), [isLowPower]);

  const { geometry } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sd = new Float32Array(count * 3);
    const idx = new Float32Array(count);
    const grp = new Float32Array(count);
    const phs = new Float32Array(count);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      sd[i * 3] = (i * 0.618033988749895) % 1.0;
      sd[i * 3 + 1] = i / count;
      sd[i * 3 + 2] = Math.random();

      idx[i] = i / count;
      grp[i] = Math.random();
      phs[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.5 + Math.random() * 1.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(sd, 3));
    geo.setAttribute('aIndex', new THREE.BufferAttribute(idx, 1));
    geo.setAttribute('aGroup', new THREE.BufferAttribute(grp, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phs, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));

    return { geometry: geo };
  }, [count]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMousePos: { value: new THREE.Vector3(0, 0, 0) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uDevicePixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2) },
      uLightPosition: { value: new THREE.Vector3(5.0, 7.0, 4.0) },
      uFillLightPosition: { value: new THREE.Vector3(-4.0, -3.0, -2.0) },
    }),
    []
  );

  const mouseTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentMouse = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    const dt = Math.min(delta, 0.1);
    materialRef.current.uniforms.uTime.value += dt;

    mouseTarget.current.set(
      (pointerPos.current.x * viewport.width) / 2.2,
      (pointerPos.current.y * viewport.height) / 2.2,
      0.5
    );

    currentMouse.current.lerp(mouseTarget.current, 0.04);
    materialRef.current.uniforms.uMousePos.value.copy(currentMouse.current);
    materialRef.current.uniforms.uPointer.value.set(pointerPos.current.x, pointerPos.current.y);

    // Subtle pointer parallax and tilt ONLY — NO rigid continuous global rotation!
    // The internal fluid dynamics and travelling streams provide the motion!
    if (pointsRef.current) {
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(
        pointsRef.current.rotation.y,
        pointerPos.current.x * 0.18,
        0.04
      );
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(
        pointsRef.current.rotation.x,
        -pointerPos.current.y * 0.12,
        0.04
      );
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={neuralVertexShader}
        fragmentShader={neuralFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};
