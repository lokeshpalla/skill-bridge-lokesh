import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { ArrowRight, BookOpen, Code2, LogIn, MousePointer2, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import GxIcon from "@/components/ui/GxIcon";
import grexilLogo from "@/assets/grexil-logo.png";

interface AcademyColors {
  background: string;
  foreground: string;
  primary: string;
  success: string;
  warning: string;
  accent: string;
  card: string;
  border: string;
}

function useAcademyColors(): AcademyColors {
  return useMemo(() => {
    const styles = typeof window === "undefined" ? null : getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => {
      const value = styles?.getPropertyValue(name).trim();
      return value ? `hsl(${value})` : fallback;
    };

    return {
      background: read("--background", "hsl(210 20% 99%)"),
      foreground: read("--foreground", "hsl(220 25% 12%)"),
      primary: read("--primary", "hsl(217 78% 36%)"),
      success: read("--success", "hsl(152 60% 40%)"),
      warning: read("--warning", "hsl(38 92% 50%)"),
      accent: read("--accent", "hsl(217 78% 36%)"),
      card: read("--card", "hsl(0 0% 100%)"),
      border: read("--border", "hsl(214 18% 90%)"),
    };
  }, []);
}

function CampusBackdrop({ colors }: { colors: AcademyColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.025;
    group.current.position.y = Math.sin(clock.elapsedTime * 0.35) * 0.08;
  });

  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.35} receiveShadow>
        <circleGeometry args={[24, 64]} />
        <meshStandardMaterial color={colors.card} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.3}>
        <ringGeometry args={[8.5, 15, 64]} />
        <meshBasicMaterial color={colors.border} transparent opacity={0.62} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.29}>
        <ringGeometry args={[5.4, 5.48, 64]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        const radius = 10.8;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, -1.12, Math.sin(angle) * radius]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.04, 0.04, 2.4]} />
            <meshBasicMaterial color={colors.border} transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function FloatingOrb({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7}>
      <mesh position={position} scale={scale}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} roughness={0.25} metalness={0.35} />
      </mesh>
    </Float>
  );
}

interface ZoneProps {
  position: [number, number, number];
  color: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof BookOpen;
  href: string;
  onSelect: (href: string) => void;
}

function Zone({ position, color, title, eyebrow, description, icon: Icon, href, onSelect }: ZoneProps) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = hovered ? 1.07 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.exp(-7 * delta));
  });

  return (
    <group
      ref={group}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(href);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[2.15, 2.4, 0.45, 6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[1.55, 1.8, 0.35, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.3 : 0.1} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <coneGeometry args={[1.2, 1.7, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} roughness={0.34} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <torusGeometry args={[0.72, 0.045, 8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.95 : 0.58} />
      </mesh>
      <Html position={[0, 2.05, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div className={`w-44 text-center transition-transform duration-200 ${hovered ? "-translate-y-1" : ""}`}>
          <div className="mb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.24em] text-primary/80">{eyebrow}</div>
          <div className="text-base font-bold text-foreground">{title}</div>
          <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{description}</div>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/90 px-2.5 py-1 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            <Icon className="h-3 w-3" /> Enter zone
          </div>
        </div>
      </Html>
    </group>
  );
}

function AcademyScene({ colors, onSelect }: { colors: AcademyColors; onSelect: (href: string) => void }) {
  const { camera } = useThree();

  useMemo(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <color attach="background" args={[colors.background]} />
      <fog attach="fog" args={[colors.background, 18, 40]} />
      <ambientLight intensity={1.3} color={colors.card} />
      <hemisphereLight args={[colors.card, colors.primary, 1.25]} />
      <directionalLight position={[7, 12, 8]} intensity={2.2} color={colors.card} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} />
      <pointLight position={[0, 5, 1]} intensity={10} distance={22} color={colors.primary} />
      <CampusBackdrop colors={colors} />
      <FloatingOrb position={[-5.5, 2.4, -1.5]} color={colors.primary} scale={1.1} />
      <FloatingOrb position={[5.3, 3.1, -2.4]} color={colors.warning} scale={0.85} />
      <FloatingOrb position={[0.5, 4.2, -4.8]} color={colors.success} scale={0.7} />
      <Zone position={[-4.3, 0, 0.3]} color={colors.primary} title="Learn" eyebrow="01 / absorb" description="Courses, paths, and guided practice." icon={BookOpen} href="/courses" onSelect={onSelect} />
      <Zone position={[0, 0, -2.8]} color={colors.warning} title="Build" eyebrow="02 / ship" description="Coding challenges and team rooms." icon={Code2} href="/coding" onSelect={onSelect} />
      <Zone position={[4.3, 0, 0.3]} color={colors.success} title="Launch" eyebrow="03 / connect" description="Mentors, internships, and your portfolio." icon={Users} href="/mentors" onSelect={onSelect} />
      <Stars radius={28} depth={18} count={450} factor={1.3} saturation={0.2} fade speed={0.2} />
      <Sparkles count={55} scale={[18, 7, 18]} size={1.7} speed={0.2} color={colors.primary} opacity={0.35} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={9} maxDistance={17} maxPolarAngle={Math.PI / 2.15} minPolarAngle={Math.PI / 3.5} target={[0, 0.3, 0]} />
    </>
  );
}

const Academy3D = () => {
  const navigate = useNavigate();
  const colors = useAcademyColors();

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background" aria-label="GreXil 3D Academy">
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 8.6, 13.5], fov: 46 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
          <AcademyScene colors={colors} onSelect={navigate} />
        </Canvas>
      </div>

      <div className="pointer-events-none relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-between p-5 sm:p-8 lg:p-12">
        <div className="flex items-start justify-between gap-5">
          <div className="pointer-events-auto flex items-center gap-3">
            <img src={grexilLogo} alt="GreXil" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
            <div>
              <div className="text-lg font-bold tracking-tight text-foreground">GreXil</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Builder&apos;s Academy</div>
            </div>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border/70 bg-card/70 backdrop-blur-md" onClick={() => navigate("/auth")}>
              <LogIn className="h-4 w-4" /> Sign in
            </Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>
              Start building <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="pointer-events-auto max-w-xl pb-4 sm:pb-8 lg:pb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/75 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-md">
            <GxIcon className="h-4 w-4" /> Your career, in motion
          </div>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.03] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Learn. Build.<br /><span className="text-primary">Launch.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Navigate the academy, choose a zone, and turn focused practice into work you can show.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MousePointer2 className="h-3.5 w-3.5 text-primary" /> Drag to explore</span>
            <span className="inline-flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-warning" /> Earn XP as you go</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Academy3D;
