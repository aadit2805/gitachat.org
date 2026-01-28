"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { threeColors } from "./config";

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const count = isMobile ? 25 : 50;

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 14,
        z: (Math.random() - 0.5) * 4 - 2,
        driftSpeedX: 0.1 + Math.random() * 0.2,
        driftSpeedY: 0.08 + Math.random() * 0.15,
        driftRangeX: 0.5 + Math.random() * 1,
        driftRangeY: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        scale: 0.015 + Math.random() * 0.025,
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      const x = p.x + Math.sin(time * p.driftSpeedX + p.phase) * p.driftRangeX;
      const y = p.y + Math.cos(time * p.driftSpeedY + p.phase) * p.driftRangeY;

      dummy.position.set(x, y, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <circleGeometry args={[1, 16]} />
      <meshBasicMaterial
        color={threeColors.foreground}
        transparent
        opacity={0.12}
      />
    </instancedMesh>
  );
}

export function AmbientBackgroundCanvas() {
  return (
    <Canvas
      gl={{
        powerPreference: "low-power",
        antialias: false,
        alpha: true,
      }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ pointerEvents: "none" }}
    >
      <Particles />
    </Canvas>
  );
}
