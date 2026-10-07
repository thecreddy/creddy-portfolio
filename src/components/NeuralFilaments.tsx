import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NeuralFilamentsProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
}

export const NeuralFilaments: React.FC<NeuralFilamentsProps> = ({ pointerPos }) => {
  const lineGroupRef = useRef<THREE.Group>(null);
  const numFilaments = 16;
  const segmentsPerFilament = 48;

  // Initialize geometries and curve data once
  const { filamentsData, lines } = useMemo(() => {
    const data = Array.from({ length: numFilaments }, (_, fIdx) => {
      const strandPhase = (fIdx / numFilaments) * Math.PI * 2;
      const strandElevation = (fIdx / numFilaments - 0.5) * 2.8;
      const seed = (fIdx * 1.618) % 1.0;

      const positions = new Float32Array((segmentsPerFilament + 1) * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      return {
        strandPhase,
        strandElevation,
        seed,
        geometry,
        positions,
      };
    });

    const lns = data.map((fil, idx) => {
      const material = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? '#383632' : '#706C62',
        transparent: true,
        opacity: 0.32,
      });
      return new THREE.Line(fil.geometry, material);
    });

    return { filamentsData: data, lines: lns };
  }, [numFilaments, segmentsPerFilament]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lines.forEach((line) => {
        line.geometry.dispose();
        if (Array.isArray(line.material)) {
          line.material.forEach((m) => m.dispose());
        } else {
          line.material.dispose();
        }
      });
    };
  }, [lines]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 28.0;
    const progress = (time / cycleDuration) % 1.0;

    const stateFloat = progress * 5.0;
    const currentStage = Math.floor(stateFloat);
    const localS = stateFloat - currentStage;
    const w = localS * localS * localS * (localS * (localS * 6.0 - 15.0) + 10.0);

    filamentsData.forEach((fil) => {
      const { strandPhase, seed, positions, geometry } = fil;

      for (let s = 0; s <= segmentsPerFilament; s++) {
        const u = s / segmentsPerFilament;
        const theta = strandPhase + u * Math.PI * 1.6 + time * 0.08;
        const phi = Math.acos(Math.max(-1, Math.min(1, (u * 2 - 1) * 0.9)));

        // State 1: Compact Neural Core Filaments
        const r1 = 0.95 + 0.35 * Math.sin(theta * 3.0 + seed * 4.0) * Math.cos(phi * 2.0);
        const p1x = r1 * Math.sin(phi) * Math.cos(theta);
        const p1y = r1 * Math.cos(phi);
        const p1z = r1 * Math.sin(phi) * Math.sin(theta);

        // State 2: Outward Flowing Plumes
        const r2 = 2.5 + 1.2 * u + 0.3 * Math.sin(theta * 2.0 + time * 0.4);
        const flowAngle = theta + 0.8 * Math.log(1.0 + r2);
        const p2x = r2 * Math.sin(phi) * Math.cos(flowAngle);
        const p2y = r2 * Math.cos(phi) + 0.3 * Math.sin(flowAngle * 2.0);
        const p2z = r2 * Math.sin(phi) * Math.sin(flowAngle);

        // State 3: Stretched, Separated Helical Strands
        const h3 = (u - 0.5) * 4.2;
        const twist3 = h3 * 1.5 + strandPhase + time * 0.2;
        const r3 = 1.8 + 0.3 * Math.sin(strandPhase * 2.0);
        const p3x = r3 * Math.cos(twist3);
        const p3y = h3;
        const p3z = r3 * Math.sin(twist3);

        // State 4: Flowing Continuous Torus Loop
        const tKnot = u * Math.PI * 2 + strandPhase + time * 0.22;
        const R_maj = 2.25;
        const r_min = 0.65;
        const swirlAngle = strandPhase * 2.0 + u * Math.PI * 4 + time * 0.8;
        const p4x = (R_maj + 0.45 * Math.cos(3.0 * tKnot)) * Math.cos(2.0 * tKnot) + r_min * Math.cos(swirlAngle) * Math.cos(2.0 * tKnot);
        const p4y = 0.65 * Math.sin(3.0 * tKnot) + r_min * Math.sin(swirlAngle);
        const p4z = (R_maj + 0.45 * Math.cos(3.0 * tKnot)) * Math.sin(2.0 * tKnot) + r_min * Math.cos(swirlAngle) * Math.sin(2.0 * tKnot);

        // State 5: Refined AI Core Shells
        const r5 = 1.3 + 0.1 * Math.cos(6.0 * theta) * Math.cos(6.0 * phi);
        const p5x = r5 * Math.sin(phi) * Math.cos(theta + time * 0.08);
        const p5y = r5 * Math.cos(phi);
        const p5z = r5 * Math.sin(phi) * Math.sin(theta + time * 0.08);

        let curAx = 0, curAy = 0, curAz = 0;
        let curBx = 0, curBy = 0, curBz = 0;

        if (currentStage === 0) {
          curAx = p1x; curAy = p1y; curAz = p1z;
          curBx = p2x; curBy = p2y; curBz = p2z;
        } else if (currentStage === 1) {
          curAx = p2x; curAy = p2y; curAz = p2z;
          curBx = p3x; curBy = p3y; curBz = p3z;
        } else if (currentStage === 2) {
          curAx = p3x; curAy = p3y; curAz = p3z;
          curBx = p4x; curBy = p4y; curBz = p4z;
        } else if (currentStage === 3) {
          curAx = p4x; curAy = p4y; curAz = p4z;
          curBx = p5x; curBy = p5y; curBz = p5z;
        } else {
          curAx = p5x; curAy = p5y; curAz = p5z;
          curBx = p1x; curAy = p1y; curAz = p1z;
        }

        positions[s * 3] = curAx + (curBx - curAx) * w;
        positions[s * 3 + 1] = curAy + (curBy - curAy) * w;
        positions[s * 3 + 2] = curAz + (curBz - curAz) * w;
      }

      geometry.attributes.position.needsUpdate = true;
    });

    if (lineGroupRef.current) {
      lineGroupRef.current.rotation.y += 0.003;
      lineGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        lineGroupRef.current.rotation.x,
        -pointerPos.current.y * 0.1,
        0.04
      );
    }
  });

  return (
    <group ref={lineGroupRef}>
      {lines.map((line, idx) => (
        <primitive key={idx} object={line} />
      ))}
    </group>
  );
};
