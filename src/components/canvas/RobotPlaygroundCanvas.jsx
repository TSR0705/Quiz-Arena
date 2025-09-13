import React, { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, useAnimations } from "@react-three/drei";
import CanvasLoader from "../Loader";

const RobotPlayground = ({ ...props }) => {
  const group = useRef();
  const { scene, animations } = useGLTF("/robot_playground/scene.gltf");
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (animations.length > 0) {
      let currentIndex = 0;
      const playNextAnimation = () => {
        const action = actions[animations[currentIndex].name];
        if (action) {
          action.reset().fadeIn(0.5).play();
          mixer.addEventListener("finished", () => {
            action.fadeOut(0.5);
            currentIndex = (currentIndex + 1) % animations.length;
            playNextAnimation();
          });
        }
      };
      playNextAnimation();

      // Cleanup mixer listeners on unmount
      return () => {
        mixer.removeEventListener("finished");
      };
    }
  }, [actions, animations, mixer]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive
        object={scene}
        scale={0.8}
        position={[0, -2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
};

const RobotPlaygroundCanvas = () => {
  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1, 7], fov: 50 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
        />
        <RobotPlayground />
        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default RobotPlaygroundCanvas;