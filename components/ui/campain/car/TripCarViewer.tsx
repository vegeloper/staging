'use client';

import { useEffect, useRef } from 'react';
import { Rotate3d } from 'lucide-react';
import carLayout from './Car.module.css';
import styles from './TripCarViewer.module.css';

const MODEL_URL = '/models/car-object.glb';

// Opaque pixel box of CampaignCar.png (973x469) so the 3D car
// matches the photo's perceived width, not just the frame.
const PHOTO_FILL_X = 941 / 973;

function getPhotoCarCssWidth() {
  const viewport = window.innerWidth;
  let padX = 20;
  let maxCar = 850;
  if (viewport <= 420) {
    padX = 14;
    maxCar = Number.POSITIVE_INFINITY;
  } else if (viewport <= 640) {
    padX = 18;
    maxCar = Number.POSITIVE_INFINITY;
  } else if (viewport <= 900) {
    padX = 24;
    maxCar = 700;
  }
  return Math.min(viewport - padX * 2, maxCar);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function readGlbImageUris(buffer: ArrayBuffer) {
  const header = new DataView(buffer, 0, 12);
  if (header.getUint32(0, true) !== 0x46546c67) {
    throw new Error('Not a GLB file');
  }

  const jsonChunkLength = new DataView(buffer, 12, 8).getUint32(0, true);
  const jsonStart = 20;
  const json = JSON.parse(
    new TextDecoder().decode(buffer.slice(jsonStart, jsonStart + jsonChunkLength))
  );
  const binStart = jsonStart + jsonChunkLength + 8;
  const binChunkLength = new DataView(buffer, jsonStart + jsonChunkLength, 8).getUint32(0, true);
  const bin = new Uint8Array(buffer, binStart, binChunkLength);

  return (json.images ?? []).map((image: { mimeType?: string; bufferView: number }) => {
    const view = json.bufferViews[image.bufferView];
    const bytes = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    return `data:${image.mimeType ?? 'image/jpeg'};base64,${bytesToBase64(bytes)}`;
  });
}

function loadTexture(
  THREE: typeof import('three'),
  uri: string,
  colorSpace: string,
) {
  return new Promise<import('three').Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      uri,
      (texture) => {
        texture.colorSpace = colorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export default function TripCarViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;
    let renderer: import('three').WebGLRenderer | undefined;
    let controls: { dispose: () => void; update: () => void } | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const boot = async () => {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

      if (disposed || !container.isConnected) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      scene.add(new THREE.HemisphereLight(0xffffff, 0xc8c8c8, 0.9));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
      fillLight.position.set(-4, 2, -2);
      scene.add(fillLight);

      renderer.domElement.style.cursor = 'grab';

      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enablePan = false;
      orbit.enableZoom = false;
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbit.minPolarAngle = 0.2;
      orbit.maxPolarAngle = Math.PI - 0.2;
      orbit.autoRotate = true;
      orbit.autoRotateSpeed = 0.45;
      orbit.addEventListener('start', () => {
        renderer!.domElement.style.cursor = 'grabbing';
      });
      orbit.addEventListener('end', () => {
        renderer!.domElement.style.cursor = 'grab';
      });
      controls = orbit;

      let modelBox: import('three').Box3 | undefined;
      let hasInitialPose = false;

      const frameToPhoto = (resetPose: boolean) => {
        if (!modelBox) return;

        const size = modelBox.getSize(new THREE.Vector3());
        const center = modelBox.getCenter(new THREE.Vector3());
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        const canvasWidth = container.clientWidth;
        const targetFillX = (getPhotoCarCssWidth() * PHOTO_FILL_X) / canvasWidth;
        // Widest silhouette as the car yaws — same perceived width as the photo.
        const maxProjectedWidth = Math.hypot(size.x, size.z);
        const distance =
          maxProjectedWidth / (2 * tanHalf * camera.aspect * targetFillX);

        orbit.target.copy(center);

        if (resetPose || !hasInitialPose) {
          const yaw = THREE.MathUtils.degToRad(148);
          const pitch = THREE.MathUtils.degToRad(14);
          const direction = new THREE.Vector3(
            Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            Math.cos(yaw) * Math.cos(pitch)
          );
          camera.position.copy(center).addScaledVector(direction, distance);
          hasInitialPose = true;
        } else {
          const offset = camera.position.clone().sub(orbit.target);
          if (offset.lengthSq() > 1e-8) {
            camera.position.copy(orbit.target).add(offset.setLength(distance));
          }
        }

        camera.lookAt(center);
        camera.updateProjectionMatrix();
        orbit.update();
      };

      const sizeToContainer = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer?.setSize(width, height, false);
        frameToPhoto(false);
      };

      sizeToContainer();
      resizeObserver = new ResizeObserver(sizeToContainer);
      resizeObserver.observe(container);

      const glbBuffer = await fetch(MODEL_URL).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${MODEL_URL}`);
        return response.arrayBuffer();
      });
      if (disposed) return;

      const imageUris = readGlbImageUris(glbBuffer);
      const [albedo, metalRough, normal] = await Promise.all([
        loadTexture(THREE, imageUris[0], THREE.SRGBColorSpace),
        loadTexture(THREE, imageUris[1], THREE.NoColorSpace),
        loadTexture(THREE, imageUris[2], THREE.NoColorSpace),
      ]);
      if (disposed) return;

      const gltf = await new Promise<import('three/addons/loaders/GLTFLoader.js').GLTF>(
        (resolve, reject) => {
          new GLTFLoader().parse(glbBuffer, '', resolve, reject);
        }
      );
      if (disposed) return;

      const model = gltf.scene;
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.material) return;
        const material = child.material as import('three').MeshStandardMaterial;
        material.map = albedo;
        material.metalnessMap = metalRough;
        material.roughnessMap = metalRough;
        material.normalMap = normal;
        material.needsUpdate = true;
      });
      scene.add(model);

      modelBox = new THREE.Box3().setFromObject(model);
      frameToPhoto(true);

      const animate = () => {
        if (disposed) return;
        orbit.update();
        renderer?.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      };

      animate();
    };

    void boot();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div className={`${carLayout.carWrapper} ${styles.stack}`}>
      <div className={styles.hint} aria-hidden="true">
        <Rotate3d strokeWidth={1.6} />
      </div>
      <div className={styles.stage}>
        <div className={styles.shadow} />
        <div
          ref={containerRef}
          className={styles.canvas}
          role="img"
          aria-label="مدل سه‌بعدی خودرو دات‌وان تریپ، قابل چرخش"
        />
      </div>
    </div>
  );
}
