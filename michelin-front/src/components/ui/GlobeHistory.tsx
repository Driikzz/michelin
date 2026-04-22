import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GameHistoryEntry } from '../../types/api';

interface Props {
  entries: GameHistoryEntry[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

const PIN_COLOR         = 0xba0b2f;
const PIN_ACTIVE_COLOR  = 0xff3355;
const GLOBE_COLOR       = 0x1a1f3c;
const ATMO_COLOR        = 0x3a6fdf;
const LINE_COLOR        = 0xba0b2f;
const GLOBE_RADIUS      = 1;
const PIN_RADIUS        = GLOBE_RADIUS + 0.022;

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

// Smoothly rotate camera so `targetPos` faces the viewer
function sphericalLerp(camera: THREE.Camera, targetPos: THREE.Vector3, t: number) {
  const currentDir = camera.position.clone().normalize();
  const targetDir  = targetPos.clone().normalize();
  const lerped     = currentDir.clone().lerp(targetDir, t).normalize();
  const dist       = camera.position.length();
  camera.position.copy(lerped.multiplyScalar(dist));
  camera.lookAt(0, 0, 0);
}

export function GlobeHistory({ entries, activeIndex, onSelect }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);

  // Persistent scene objects — survive re-renders
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef   = useRef<OrbitControls | null>(null);
  const rafRef        = useRef<number>(0);
  const pinMeshesRef  = useRef<THREE.Mesh[]>([]);
  const lineRef       = useRef<THREE.Line | null>(null);
  const entriesRef    = useRef<GameHistoryEntry[]>([]);
  const activeRef     = useRef<number | null>(null);
  const flyingRef     = useRef(false);
  const flyTargetRef  = useRef<THREE.Vector3 | null>(null);

  // Keep refs in sync with props for use inside rAF loop
  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => { activeRef.current = activeIndex; }, [activeIndex]);

  // ── Init renderer, scene, camera, controls ───────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 2.8);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Globe
    const globeGeo  = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat  = new THREE.MeshPhongMaterial({ color: GLOBE_COLOR, shininess: 20 });
    scene.add(new THREE.Mesh(globeGeo, globeMat));

    // Atmosphere halo
    const atmoGeo   = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 64, 64);
    const atmoMat   = new THREE.MeshPhongMaterial({
      color: ATMO_COLOR,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan     = false;
    controls.minDistance   = 1.8;
    controls.maxDistance   = 5;
    controls.autoRotate    = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controlsRef.current = controls;

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    // Animation loop
    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      // Fly toward target
      if (flyingRef.current && flyTargetRef.current) {
        sphericalLerp(camera, flyTargetRef.current, 0.05);
        const dist = camera.position.clone().normalize().distanceTo(flyTargetRef.current.clone().normalize());
        if (dist < 0.005) {
          flyingRef.current   = false;
          flyTargetRef.current = null;
          if (controlsRef.current) controlsRef.current.autoRotate = true;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Click → raycasting
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pinMeshesRef.current);
      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh & { __entryIndex?: number };
        if (hitMesh.__entryIndex !== undefined) {
          onSelect(hitMesh.__entryIndex);
          controls.autoRotate = false;
          setTimeout(() => { if (controlsRef.current) controlsRef.current.autoRotate = true; }, 2500);
        }
      }
    }
    renderer.domElement.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      rendererRef.current  = null;
      sceneRef.current     = null;
      cameraRef.current    = null;
      controlsRef.current  = null;
    };
  // onSelect intentionally excluded — stable via closure ref pattern
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rebuild pins & lines when entries change ──────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old pins
    pinMeshesRef.current.forEach(m => scene.remove(m));
    pinMeshesRef.current = [];

    // Remove old line
    if (lineRef.current) { scene.remove(lineRef.current); lineRef.current = null; }

    const withCoords = entries.map((e, i) => ({ e, i })).filter(
      ({ e }) => e.latitude != null && e.longitude != null,
    );

    // Pins
    const pinGeo = new THREE.SphereGeometry(0.022, 8, 8);
    withCoords.forEach(({ e, i }) => {
      const mat  = new THREE.MeshPhongMaterial({ color: PIN_COLOR, shininess: 60 });
      const mesh = new THREE.Mesh(pinGeo, mat) as THREE.Mesh & { __entryIndex: number };
      mesh.__entryIndex = i;
      mesh.position.copy(latLngToVec3(e.latitude!, e.longitude!, PIN_RADIUS));
      scene.add(mesh);
      pinMeshesRef.current.push(mesh);
    });

    // Connection line (oldest → newest = reversed array)
    if (withCoords.length >= 2) {
      const points = [...withCoords].reverse().map(({ e }) =>
        latLngToVec3(e.latitude!, e.longitude!, PIN_RADIUS + 0.005),
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: LINE_COLOR,
        transparent: true,
        opacity: 0.3,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      lineRef.current = line;
    }
  }, [entries]);

  // ── Update pin visuals + fly camera when activeIndex changes ─────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    pinMeshesRef.current.forEach((mesh, idx) => {
      const mat = mesh.material as THREE.MeshPhongMaterial;
      if (idx === activeIndex) {
        mat.color.setHex(PIN_ACTIVE_COLOR);
        mat.emissive.setHex(0x550010);
        mesh.scale.setScalar(1.7);
      } else {
        mat.color.setHex(PIN_COLOR);
        mat.emissive.setHex(0x000000);
        mesh.scale.setScalar(1);
      }
    });

    if (activeIndex !== null && pinMeshesRef.current[activeIndex]) {
      const pinPos = pinMeshesRef.current[activeIndex].position;
      flyTargetRef.current = pinPos.clone();
      flyingRef.current    = true;
      if (controlsRef.current) controlsRef.current.autoRotate = false;
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: 'radial-gradient(ellipse at center, #0d1340 0%, #06081a 100%)' }}
    />
  );
}
