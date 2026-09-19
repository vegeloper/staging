import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SPRITE_PATH = path.join(ROOT, 'public/figma/car-sprite.png');
const OUTPUT_PATH = path.join(ROOT, 'public/models/trip-car.glb');

const COLS = 2;
const ROWS = 3;
const PADDING_RATIO = 0.08;

const CELLS = {
  front: { col: 0, row: 0 },
  rear: { col: 1, row: 0 },
  left: { col: 0, row: 1 },
  right: { col: 1, row: 1 },
  top: { col: 1, row: 2 },
};

const LENGTH = 4.8;
const WIDTH = 1.85;
const HEIGHT = 1.46;

function isBackground(r, g, b) {
  return r > 248 && g > 248 && b > 248;
}

function contentBox(data, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      if (!isBackground(data[i], data[i + 1], data[i + 2])) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) {
    return { left: 0, top: 0, width, height };
  }

  const padX = Math.round(width * PADDING_RATIO);
  const padY = Math.round(height * PADDING_RATIO);

  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(width, maxX + 1 + padX);
  const bottom = Math.min(height, maxY + 1 + padY);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

async function extractFace(input, cellWidth, cellHeight, face) {
  const { col, row } = CELLS[face];
  const cell = await sharp(input)
    .extract({
      left: col * cellWidth,
      top: row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const box = contentBox(cell.data, cell.info.width, cell.info.height, cell.info.channels);

  return sharp(input)
    .extract({
      left: col * cellWidth + box.left,
      top: row * cellHeight + box.top,
      width: box.width,
      height: box.height,
    })
    .png()
    .toBuffer();
}

function align(bytes, size = 4) {
  const remainder = bytes.length % size;
  if (remainder === 0) return bytes;
  const padded = Buffer.alloc(bytes.length + (size - remainder), 0);
  bytes.copy(padded);
  return padded;
}

function alignJson(text) {
  const remainder = Buffer.byteLength(text) % 4;
  if (remainder === 0) return text;
  return text + ' '.repeat(4 - remainder);
}

function createBoxGeometry() {
  const x0 = -WIDTH / 2;
  const x1 = WIDTH / 2;
  const y0 = 0;
  const y1 = HEIGHT;
  const z0 = -LENGTH / 2;
  const z1 = LENGTH / 2;

  const faces = {
    front: {
      positions: [x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0],
      normals: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
      uvs: [0, 1, 1, 1, 1, 0, 0, 0],
    },
    rear: {
      positions: [x1, y0, z1, x0, y0, z1, x0, y1, z1, x1, y1, z1],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 1, 1, 1, 1, 0, 0, 0],
    },
    right: {
      positions: [x1, y0, z0, x1, y0, z1, x1, y1, z1, x1, y1, z0],
      normals: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      uvs: [1, 1, 0, 1, 0, 0, 1, 0],
    },
    left: {
      positions: [x0, y0, z1, x0, y0, z0, x0, y1, z0, x0, y1, z1],
      normals: [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0],
      uvs: [1, 1, 0, 1, 0, 0, 1, 0],
    },
    top: {
      positions: [x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1],
      normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    bottom: {
      positions: [x0, y0, z1, x1, y0, z1, x1, y0, z0, x0, y0, z0],
      normals: [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
    },
  };

  const indices = [0, 1, 2, 0, 2, 3];
  return { faces, indices };
}

function pushFloats(target, values) {
  const offset = target.length;
  target.push(...values);
  return {
    byteOffset: offset * 4,
    count: values.length,
  };
}

async function buildGlb() {
  const sprite = sharp(SPRITE_PATH);
  const meta = await sprite.metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Could not read car sprite dimensions');
  }

  const cellWidth = Math.floor(meta.width / COLS);
  const cellHeight = Math.floor(meta.height / ROWS);
  const input = await sprite.png().toBuffer();

  const faceNames = ['front', 'rear', 'right', 'left', 'top'];
  const images = {};
  for (const name of faceNames) {
    images[name] = await extractFace(input, cellWidth, cellHeight, name);
  }

  const { faces, indices } = createBoxGeometry();
  const faceOrder = [...faceNames, 'bottom'];

  const positionData = [];
  const normalData = [];
  const uvData = [];
  const indexData = [];
  const accessors = [];
  const primitives = [];

  for (const [faceIndex, name] of faceOrder.entries()) {
    const face = faces[name];
    const posInfo = pushFloats(positionData, face.positions);
    const nrmInfo = pushFloats(normalData, face.normals);
    const uvInfo = pushFloats(uvData, face.uvs);
    const indexOffset = indexData.length;
    indexData.push(...indices);

    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < face.positions.length; i += 3) {
      min[0] = Math.min(min[0], face.positions[i]);
      min[1] = Math.min(min[1], face.positions[i + 1]);
      min[2] = Math.min(min[2], face.positions[i + 2]);
      max[0] = Math.max(max[0], face.positions[i]);
      max[1] = Math.max(max[1], face.positions[i + 1]);
      max[2] = Math.max(max[2], face.positions[i + 2]);
    }

    const positionAccessor = accessors.length;
    accessors.push({
      bufferView: 0,
      byteOffset: posInfo.byteOffset,
      componentType: 5126,
      count: 4,
      type: 'VEC3',
      min,
      max,
    });
    const normalAccessor = accessors.length;
    accessors.push({
      bufferView: 1,
      byteOffset: nrmInfo.byteOffset,
      componentType: 5126,
      count: 4,
      type: 'VEC3',
    });
    const uvAccessor = accessors.length;
    accessors.push({
      bufferView: 2,
      byteOffset: uvInfo.byteOffset,
      componentType: 5126,
      count: 4,
      type: 'VEC2',
    });
    const indexAccessor = accessors.length;
    accessors.push({
      bufferView: 3,
      byteOffset: indexOffset * 2,
      componentType: 5123,
      count: 6,
      type: 'SCALAR',
    });

    primitives.push({
      attributes: {
        POSITION: positionAccessor,
        NORMAL: normalAccessor,
        TEXCOORD_0: uvAccessor,
      },
      indices: indexAccessor,
      material: faceIndex,
    });
  }

  const positionBuffer = Buffer.from(new Float32Array(positionData).buffer);
  const normalBuffer = Buffer.from(new Float32Array(normalData).buffer);
  const uvBuffer = Buffer.from(new Float32Array(uvData).buffer);
  const indexBuffer = Buffer.from(new Uint16Array(indexData).buffer);

  const chunks = [
    align(positionBuffer),
    align(normalBuffer),
    align(uvBuffer),
    align(indexBuffer),
    ...faceNames.map((name) => align(images[name])),
  ];

  const bufferViews = [];
  let offset = 0;
  for (const [i, chunk] of chunks.entries()) {
    bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: i < 4 ? [positionBuffer, normalBuffer, uvBuffer, indexBuffer][i].length : images[faceNames[i - 4]].length,
      ...(i === 3 ? { target: 34963 } : i < 3 ? { target: 34962 } : {}),
    });
    offset += chunk.length;
  }

  const bin = Buffer.concat(chunks);

  const materials = faceNames.map((name, index) => ({
    name,
    pbrMetallicRoughness: {
      baseColorTexture: { index },
      metallicFactor: 0,
      roughnessFactor: 0.85,
    },
  }));
  materials.push({
    name: 'bottom',
    pbrMetallicRoughness: {
      baseColorFactor: [0.9, 0.9, 0.9, 1],
      metallicFactor: 0,
      roughnessFactor: 1,
    },
  });

  const json = {
    asset: {
      version: '2.0',
      generator: 'scripts/build-trip-car-glb.mjs',
    },
    scene: 0,
    scenes: [{ name: 'Scene', nodes: [0] }],
    nodes: [{ name: 'TripCar', mesh: 0 }],
    meshes: [{ name: 'TripCarMesh', primitives }],
    materials,
    textures: faceNames.map((_, index) => ({ sampler: 0, source: index })),
    images: faceNames.map((_, index) => ({
      mimeType: 'image/png',
      bufferView: 4 + index,
      name: faceNames[index],
    })),
    samplers: [
      {
        magFilter: 9729,
        minFilter: 9729,
        wrapS: 33071,
        wrapT: 33071,
      },
    ],
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }],
  };

  const jsonChunk = Buffer.from(alignJson(JSON.stringify(json)));
  const binChunk = align(bin);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

const glb = await buildGlb();
await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, glb);
console.log(`Wrote ${OUTPUT_PATH} (${glb.length} bytes)`);
