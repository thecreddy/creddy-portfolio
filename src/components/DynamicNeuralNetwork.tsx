import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DynamicNeuralNetworkProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
}

export const DynamicNeuralNetwork: React.FC<DynamicNeuralNetworkProps> = ({ pointerPos }) => {
  const lineSegmentsRef = useRef<THREE.LineSegments>(null);
  const nodesMeshRef = useRef<THREE.InstancedMesh>(null);
  const networkGroupRef = useRef<THREE.Group>(null);

  const nodeCount = 42;
  const maxPossibleLines = (nodeCount * (nodeCount - 1)) / 2;

  // Node initial states & trajectories
  const nodeSeeds = useMemo(() => {
    return Array.from({ length: nodeCount }, (_, i) => {
      // Golden spiral distribution on sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return {
        theta,
        phi,
        rBase: 0.65 + 0.35 * Math.sin(i * 1.618),
        speed: 0.4 + 0.6 * ((i * 0.382) % 1.0),
        vortexPhase: Math.random() * Math.PI * 2,
        pos: new THREE.Vector3(),
      };
    });
  }, [nodeCount]);

  // Buffers for dynamic line segments
  const { lineGeometry, linePositions, lineColors } = useMemo(() => {
    const positions = new Float32Array(maxPossibleLines * 2 * 3);
    const colors = new Float32Array(maxPossibleLines * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { lineGeometry: geometry, linePositions: positions, lineColors: colors };
  }, [maxPossibleLines]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Cleanup
  useEffect(() => {
    return () => {
      lineGeometry.dispose();
    };
  }, [lineGeometry]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 30.0;
    const phiCycle = (time / cycleDuration) * Math.PI * 2;

    // Harmonic expansion and vortex modulation (strictly continuous, zero jump)
    const expansionWeight = 0.5 - 0.5 * Math.cos(phiCycle); // 0 at core, 1 at peak expansion
    const vortexWeight = Math.max(0, Math.sin(phiCycle - 1.2) * 1.3);

    // 1. Update node 3D positions
    nodeSeeds.forEach((node, i) => {
      const { theta, phi, rBase, speed, vortexPhase } = node;

      // Radius expansion
      const r = rBase * (1.0 + 1.85 * expansionWeight);

      // Swirling angular velocity in vortex phase
      const currentTheta = theta + time * 0.08 * speed + vortexWeight * Math.sin(time * 0.2 + vortexPhase);
      const currentPhi = phi + 0.15 * Math.sin(time * 0.15 + theta);

      // Spherical to Cartesian
      let x = r * Math.sin(currentPhi) * Math.cos(currentTheta);
      let y = r * Math.cos(currentPhi);
      let z = r * Math.sin(currentPhi) * Math.sin(currentTheta);

      // Vortex displacement
      if (vortexWeight > 0.01) {
        const torusR = 2.0;
        const knotU = vortexPhase + time * 0.18;
        const vX = (torusR + 0.4 * Math.cos(3 * knotU)) * Math.cos(2 * knotU);
        const vY = 0.5 * Math.sin(3 * knotU);
        const vZ = (torusR + 0.4 * Math.cos(3 * knotU)) * Math.sin(2 * knotU);
        x = THREE.MathUtils.lerp(x, vX, vortexWeight * 0.5);
        y = THREE.MathUtils.lerp(y, vY, vortexWeight * 0.5);
        z = THREE.MathUtils.lerp(z, vZ, vortexWeight * 0.5);
      }

      node.pos.set(x, y, z);

      // Update instanced node spheres
      dummy.position.set(x, y, z);
      const nodeScale = 0.035 + 0.02 * Math.sin(time * 1.8 + i);
      dummy.scale.setScalar(nodeScale);
      dummy.updateMatrix();

      if (nodesMeshRef.current) {
        nodesMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    if (nodesMeshRef.current) {
      nodesMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Dynamic Proximity Connections (Dissolve & Reform)
    let lineVertexIndex = 0;
    const connectThreshold = 1.35;
    const connectThresholdSq = connectThreshold * connectThreshold;

    for (let i = 0; i < nodeCount; i++) {
      const posA = nodeSeeds[i].pos;
      for (let j = i + 1; j < nodeCount; j++) {
        const posB = nodeSeeds[j].pos;
        const distSq = posA.distanceToSquared(posB);

        if (distSq < connectThresholdSq) {
          const dist = Math.sqrt(distSq);
          // Connection strength: fades to 0 as nodes stretch apart (dissolves)
          const strength = Math.max(0, 1.0 - dist / connectThreshold);

          // Position A
          linePositions[lineVertexIndex * 3] = posA.x;
          linePositions[lineVertexIndex * 3 + 1] = posA.y;
          linePositions[lineVertexIndex * 3 + 2] = posA.z;

          // Color A (Warm graphite / titanium with fading opacity)
          const cVal = 0.22 + 0.35 * (1.0 - strength);
          lineColors[lineVertexIndex * 3] = cVal;
          lineColors[lineVertexIndex * 3 + 1] = cVal;
          lineColors[lineVertexIndex * 3 + 2] = cVal;

          lineVertexIndex++;

          // Position B
          linePositions[lineVertexIndex * 3] = posB.x;
          linePositions[lineVertexIndex * 3 + 1] = posB.y;
          linePositions[lineVertexIndex * 3 + 2] = posB.z;

          // Color B
          lineColors[lineVertexIndex * 3] = cVal;
          lineColors[lineVertexIndex * 3 + 1] = cVal;
          lineColors[lineVertexIndex * 3 + 2] = cVal;

          lineVertexIndex++;
        }
      }
    }

    if (lineSegmentsRef.current) {
      lineGeometry.setDrawRange(0, lineVertexIndex);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
    }

    // Subtle pointer parallax (NO rigid continuous rotation)
    if (networkGroupRef.current) {
      networkGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        networkGroupRef.current.rotation.y,
        pointerPos.current.x * 0.18,
        0.04
      );
      networkGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        networkGroupRef.current.rotation.x,
        -pointerPos.current.y * 0.12,
        0.04
      );
    }
  });

  return (
    <group ref={networkGroupRef}>
      {/* Dissolving & Reforming Line Connections */}
      <lineSegments ref={lineSegmentsRef} geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors={true}
          transparent={true}
          opacity={0.42}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </lineSegments>

      {/* Instanced Neural Nodes */}
      <instancedMesh
        ref={nodesMeshRef}
        args={[undefined, undefined, nodeCount]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color="#262524"
          roughness={0.25}
          metalness={0.4}
        />
      </instancedMesh>
    </group>
  );
};

