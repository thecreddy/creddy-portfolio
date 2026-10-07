import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DynamicNeuralMatterProps {
  pointerPos: React.MutableRefObject<{ x: number; y: number }>;
}

export const DynamicNeuralMatter: React.FC<DynamicNeuralMatterProps> = ({ pointerPos }) => {
  const matterGroupRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const innerNucleusRef = useRef<THREE.Mesh>(null);
  const lineSegmentsRef = useRef<THREE.LineSegments>(null);
  const nodesMeshRef = useRef<THREE.InstancedMesh>(null);
  const signalsMeshRef = useRef<THREE.InstancedMesh>(null);

  const nodeCount = 52;
  const signalPacketCount = 28;
  const maxLines = (nodeCount * (nodeCount - 1)) / 2;

  // 1. Asymmetric Node Centroids
  const nodeData = useMemo(() => {
    return Array.from({ length: nodeCount }, (_, i) => {
      const u = (i / nodeCount) * Math.PI * 2;
      const v = ((i % 13) / 13 - 0.5) * 3.6;
      const seedZ = ((i * 1.618) % 1.0);
      return {
        u,
        v,
        seedZ,
        speed: 0.6 + 0.8 * ((i * 0.382) % 1.0),
        vortexPhase: Math.random() * Math.PI * 2,
        pos: new THREE.Vector3(),
      };
    });
  }, [nodeCount]);

  // 2. Data Signals Travelling Between Nodes
  const signalPackets = useMemo(() => {
    return Array.from({ length: signalPacketCount }, (_, i) => ({
      nodeA: i % nodeCount,
      nodeB: (i + 3) % nodeCount,
      progress: Math.random(),
      speed: 0.4 + Math.random() * 0.6,
      pos: new THREE.Vector3(),
    }));
  }, [signalPacketCount, nodeCount]);

  // 3. Line Buffers
  const { lineGeometry, linePositions, lineColors } = useMemo(() => {
    const positions = new Float32Array(maxLines * 2 * 3);
    const colors = new Float32Array(maxLines * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { lineGeometry: geo, linePositions: positions, lineColors: colors };
  }, [maxLines]);

  // 4. Deforming Metamorphic Core Geometry (High Subdivision)
  const { coreBaseGeo, coreDeformedGeo, originalPos } = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(0.82, 4);
    const deformed = base.clone();
    const orig = base.attributes.position.array.slice() as Float32Array;
    return { coreBaseGeo: base, coreDeformedGeo: deformed, originalPos: orig };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lineGeometry.dispose();
      coreBaseGeo.dispose();
      coreDeformedGeo.dispose();
    };
  }, [lineGeometry, coreBaseGeo, coreDeformedGeo]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Multi-frequency quasi-periodic continuous cycle (never repeats identically, completely seamless)
    const t1 = time * 0.224; // ~28s base cycle
    const t2 = time * 0.149; // ~42s secondary harmonic
    const t3 = time * 0.331; // ~19s fine flow

    const expand = 0.5 - 0.45 * Math.cos(t1) + 0.15 * Math.sin(t2);
    const vortexFlow = Math.max(0, Math.sin(t1 - 1.2) * 1.25 + 0.2 * Math.cos(t2));
    const latticeReorg = Math.max(0, Math.sin(t1 - 2.8) * 1.35 + 0.25 * Math.sin(t2 * 1.5));

    // A. Update Deforming Organic Core Mesh Vertices
    const corePosAttr = coreDeformedGeo.attributes.position;
    const corePosArray = corePosAttr.array as Float32Array;
    const vertexCount = originalPos.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const ox = originalPos[i * 3];
      const oy = originalPos[i * 3 + 1];
      const oz = originalPos[i * 3 + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      // Asymmetric continuous undulation
      const lobeWave = Math.sin(nx * 3.5 + t1) * Math.cos(ny * 2.5 + t2);
      const vortexRipple = vortexFlow * Math.sin(nz * 4.0 + nx * 2.0 + t3 * 2.0) * 0.45;
      const breathing = 1.0 + 0.2 * (lobeWave + vortexRipple);

      // Morphing scale factors (stretches, bends, contracts)
      const sx = (1.0 + 0.45 * expand - 0.25 * vortexFlow) * breathing;
      const sy = (1.0 - 0.3 * expand + 0.4 * vortexFlow) * breathing;
      const sz = (1.0 + 0.45 * expand - 0.25 * vortexFlow) * breathing;

      corePosArray[i * 3] = ox * sx;
      corePosArray[i * 3 + 1] = oy * sy;
      corePosArray[i * 3 + 2] = oz * sz;
    }
    corePosAttr.needsUpdate = true;
    coreDeformedGeo.computeVertexNormals();

    // B. Update 52 Neural Node Centroids
    nodeData.forEach((node, idx) => {
      const { u, v, seedZ, speed, vortexPhase } = node;

      // 1. Compact multi-lobed core
      const lobe = 1.0 + 0.35 * Math.sin(3.0 * u + seedZ * 4.0) * Math.cos(2.0 * v);
      const rBase = (0.65 + 0.4 * seedZ) * lobe;
      const p1x = rBase * Math.cos(u) * (1.0 + 0.2 * Math.sin(v * 2.0));
      const p1y = v * 0.45 + 0.25 * Math.sin(u * 2.0);
      const p1z = rBase * Math.sin(u) * (1.0 + 0.2 * Math.cos(v * 2.0));

      // 2. Outward fluid expansion
      const rExp = 2.3 + 1.1 * seedZ + 0.4 * Math.sin(u * 2.0 + t1);
      const plumeAngle = u + 0.8 * Math.log(1.0 + rExp) + t3 * 0.2;
      const p2x = rExp * Math.cos(plumeAngle) + 0.35 * Math.sin(v * 1.5);
      const p2y = v * 1.25 + 0.45 * Math.sin(plumeAngle * 2.0);
      const p2z = rExp * Math.sin(plumeAngle) * 0.85;

      // 3. Twisted 3D Möbius / Vortex loop
      const knotU = vortexPhase + time * 0.12 * speed;
      const R_vortex = 1.95;
      const p3x = (R_vortex + 0.45 * Math.cos(3.0 * knotU)) * Math.cos(2.0 * knotU);
      const p3y = 0.65 * Math.sin(3.0 * knotU) + 0.25 * Math.cos(knotU);
      const p3z = (R_vortex + 0.45 * Math.cos(3.0 * knotU)) * Math.sin(2.0 * knotU) * 0.9;

      // Blend across continuum
      let x = THREE.MathUtils.lerp(p1x, p2x, expand);
      let y = THREE.MathUtils.lerp(p1y, p2y, expand);
      let z = THREE.MathUtils.lerp(p1z, p2z, expand);

      if (vortexFlow > 0.01) {
        x = THREE.MathUtils.lerp(x, p3x, vortexFlow * 0.7);
        y = THREE.MathUtils.lerp(y, p3y, vortexFlow * 0.7);
        z = THREE.MathUtils.lerp(z, p3z, vortexFlow * 0.7);
      }

      // Independent organic wandering offset (ensures zero rigid feeling)
      x += Math.sin(time * 0.4 * speed + idx) * 0.12;
      y += Math.cos(time * 0.35 * speed + idx * 2.0) * 0.12;
      z += Math.sin(time * 0.3 * speed + idx * 3.0) * 0.12;

      node.pos.set(x, y, z);

      // Node instance matrix
      dummy.position.set(x, y, z);
      const nScale = 0.038 + 0.02 * Math.sin(time * 2.0 + idx);
      dummy.scale.setScalar(nScale);
      dummy.updateMatrix();

      if (nodesMeshRef.current) {
        nodesMeshRef.current.setMatrixAt(idx, dummy.matrix);
      }
    });

    if (nodesMeshRef.current) {
      nodesMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // C. Dynamic Dissolving & Reforming Line Segments
    let lineIdx = 0;
    const connectDist = 1.35;
    const connectDistSq = connectDist * connectDist;

    for (let i = 0; i < nodeCount; i++) {
      const posA = nodeData[i].pos;
      for (let j = i + 1; j < nodeCount; j++) {
        const posB = nodeData[j].pos;
        const dSq = posA.distanceToSquared(posB);

        if (dSq < connectDistSq) {
          const d = Math.sqrt(dSq);
          const strength = Math.max(0, 1.0 - d / connectDist);

          // Alpha / color based on connection proximity
          const colVal = 0.24 + 0.38 * (1.0 - strength);

          linePositions[lineIdx * 3] = posA.x;
          linePositions[lineIdx * 3 + 1] = posA.y;
          linePositions[lineIdx * 3 + 2] = posA.z;
          lineColors[lineIdx * 3] = colVal;
          lineColors[lineIdx * 3 + 1] = colVal;
          lineColors[lineIdx * 3 + 2] = colVal;
          lineIdx++;

          linePositions[lineIdx * 3] = posB.x;
          linePositions[lineIdx * 3 + 1] = posB.y;
          linePositions[lineIdx * 3 + 2] = posB.z;
          lineColors[lineIdx * 3] = colVal;
          lineColors[lineIdx * 3 + 1] = colVal;
          lineColors[lineIdx * 3 + 2] = colVal;
          lineIdx++;
        }
      }
    }

    if (lineSegmentsRef.current) {
      lineGeometry.setDrawRange(0, lineIdx);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
    }

    // D. Data Signal Packets Travelling Through Network
    signalPackets.forEach((sig, sIdx) => {
      sig.progress += 0.015 * sig.speed;
      if (sig.progress > 1.0) {
        sig.progress = 0;
        sig.nodeA = sig.nodeB;
        sig.nodeB = (sig.nodeB + 1 + (sIdx % 5)) % nodeCount;
      }

      const pA = nodeData[sig.nodeA].pos;
      const pB = nodeData[sig.nodeB].pos;
      sig.pos.lerpVectors(pA, pB, sig.progress);

      dummy.position.copy(sig.pos);
      const sigScale = 0.024 + 0.012 * Math.sin(time * 4.0 + sIdx);
      dummy.scale.setScalar(sigScale);
      dummy.updateMatrix();

      if (signalsMeshRef.current) {
        signalsMeshRef.current.setMatrixAt(sIdx, dummy.matrix);
      }
    });

    if (signalsMeshRef.current) {
      signalsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // E. Internal Nucleus Pulse
    if (innerNucleusRef.current) {
      const pulseScale = 0.36 + 0.06 * Math.sin(time * 2.8);
      innerNucleusRef.current.scale.setScalar(pulseScale);
      innerNucleusRef.current.rotation.y = time * 0.15;
      innerNucleusRef.current.rotation.x = time * 0.1;
    }

    // F. Restrained Pointer Interaction (subtle tilt and parallax, NO global rigid spin)
    if (matterGroupRef.current) {
      matterGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        matterGroupRef.current.rotation.y,
        pointerPos.current.x * 0.16,
        0.04
      );
      matterGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        matterGroupRef.current.rotation.x,
        -pointerPos.current.y * 0.12,
        0.04
      );
    }
  });

  return (
    <group ref={matterGroupRef}>
      {/* 1. Deforming Metamorphic Organic Core Kernel */}
      <mesh ref={coreMeshRef} geometry={coreDeformedGeo}>
        <meshPhysicalMaterial
          roughness={0.22}
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

      {/* 2. Internal Cryptographic AI Nucleus */}
      <mesh ref={innerNucleusRef}>
        <dodecahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial
          color="#1E1D1C"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* 3. Dynamic Dissolving & Reforming Neural Synapse Connections */}
      <lineSegments ref={lineSegmentsRef} geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors={true}
          transparent={true}
          opacity={0.38}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </lineSegments>

      {/* 4. Active Instanced Neural Nodes */}
      <instancedMesh
        ref={nodesMeshRef}
        args={[undefined, undefined, nodeCount]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color="#242322"
          roughness={0.25}
          metalness={0.45}
        />
      </instancedMesh>

      {/* 5. Travelling Data Signal Pulse Packets */}
      <instancedMesh
        ref={signalsMeshRef}
        args={[undefined, undefined, signalPacketCount]}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color="#141413"
          transparent={true}
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
};

