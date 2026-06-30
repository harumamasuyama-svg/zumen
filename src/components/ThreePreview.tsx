import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { PlanShape, PlanState, ThreeMode } from '../types';

interface Props { plan: PlanState; selectedId?: string; mode: ThreeMode; }
const scale = 0.01;

function makeObject(shape: PlanShape, selected: boolean) {
  const h = shape.kind === 'door' || shape.kind === 'slidingDoor' ? 2 : shape.kind === 'wall' || shape.kind === 'partition' ? 2.4 : 0.72;
  const w = Math.max(shape.width * scale, 0.18);
  const d = Math.max(shape.height * scale, 0.18);
  const geometry = new THREE.BoxGeometry(w, h, d);
  const color = selected ? 0x0f6bdc : shape.kind === 'wall' ? 0x475467 : shape.kind === 'partition' ? 0x98a2b3 : shape.kind === 'door' || shape.kind === 'slidingDoor' ? 0x9c6b30 : 0xe6eef8;
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.02 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((shape.x - 450 + shape.width / 2) * scale, h / 2, (shape.y - 310 + shape.height / 2) * scale);
  return mesh;
}

export function ThreePreview({ plan, selectedId, mode }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(55, Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1), 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1));
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.05, 6.8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    floor.position.y = -0.025;
    scene.add(floor);
    scene.add(new THREE.GridHelper(10, 20, 0xd0d5dd, 0xeaecf0));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd0d5dd, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2.6);
    light.position.set(4, 8, 5);
    scene.add(light);
    const group = new THREE.Group();
    scene.add(group);
    sceneRef.current = scene; cameraRef.current = camera; rendererRef.current = renderer; groupRef.current = group;
    let dragging = false; let last = { x: 0, y: 0 };
    const render = () => renderer.render(scene, camera);
    const down = (e: PointerEvent) => { dragging = true; last = { x: e.clientX, y: e.clientY }; };
    const move = (e: PointerEvent) => { if (!dragging || mode === 'walk') return; group.rotation.y += (e.clientX - last.x) * 0.01; group.rotation.x += (e.clientY - last.y) * 0.004; last = { x: e.clientX, y: e.clientY }; render(); };
    const up = () => { dragging = false; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); camera.position.multiplyScalar(e.deltaY > 0 ? 1.08 : 0.92); render(); };
    renderer.domElement.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); renderer.domElement.addEventListener('wheel', wheel, { passive: false });
    const resize = () => { camera.aspect = Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1); camera.updateProjectionMatrix(); renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1)); render(); };
    window.addEventListener('resize', resize);
    render();
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); renderer.dispose(); mount.innerHTML = ''; };
  }, []);

  useEffect(() => {
    const group = groupRef.current; const camera = cameraRef.current; const renderer = rendererRef.current; const scene = sceneRef.current;
    if (!group || !camera || !renderer || !scene) return;
    group.clear();
    plan.shapes.filter((s) => !['text', 'dimension'].includes(s.kind)).forEach((shape) => group.add(makeObject(shape, shape.id === selectedId)));
    if (mode === 'bird') camera.position.set(0, 8.2, 0.1);
    if (mode === 'iso') camera.position.set(5.4, 5.1, 5.4);
    if (mode === 'walk') camera.position.set(0, 1.65, 5.8);
    camera.lookAt(0, mode === 'walk' ? 1.2 : 0.4, 0);
    renderer.render(scene, camera);
  }, [plan, selectedId, mode]);

  return <div className="threePreview" ref={mountRef} />;
}
