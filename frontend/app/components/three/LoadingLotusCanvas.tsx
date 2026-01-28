"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { threeColors } from "./config";

function Lotus() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;

    // Gentle rotation
    groupRef.current.rotation.y = time * 0.3;

    // Subtle pulse
    const pulse = 0.7 + Math.sin(time * 1.5) * 0.3;
    materialRef.current.opacity = pulse;
  });

  const petalCount = 8;
  const petals = [];

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    petals.push(
      <mesh
        key={i}
        position={[Math.cos(angle) * 0.15, 0, Math.sin(angle) * 0.15]}
        rotation={[Math.PI / 6, angle, 0]}
      >
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial
          ref={i === 0 ? materialRef : undefined}
          color={threeColors.saffron}
          transparent
          opacity={0.8}
        />
      </mesh>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={threeColors.saffron} transparent opacity={0.9} />
      </mesh>
      {petals}
    </group>
  );
}

export function LoadingLotusCanvas() {
  return (
    <div className="inline-flex h-5 w-8 items-center justify-center">
      <Canvas
        gl={{
          powerPreference: "low-power",
          antialias: false,
          alpha: true,
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 1, 2], fov: 30 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Lotus />
      </Canvas>
    </div>
  );
}
