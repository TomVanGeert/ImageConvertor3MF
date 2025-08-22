// --- IMPORT CONSTANTS ---
import { PRINT_COLOR_RAISED, PRINT_COLOR_BASE } from './constants';

// Define types for clarity and type safety
type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };
type Dimensions = { baseHeight: number; detailHeight: number };
type Colors = { raisedColor: string; baseColor: string };

/**
* Generates the XML content for a 3MF file with two separate, manifold (watertight) objects.
* One object is the base plate, and the other represents the raised details.
*
* @param heightmap 2D array of pixel brightness (0 for black, 255 for white).
* @param dimensions An object containing the base and detail height in mm.
* @param colors An optional object to override the default HEX colors.
* @returns The full XML string for the 3dmodel.model file.
*/
export function generateMultiPart3mf(
  heightmap: number[][],
  dimensions: Dimensions,
  colors: Colors = {
    raisedColor: PRINT_COLOR_RAISED,
    baseColor: PRINT_COLOR_BASE
  }
): string | null {
  if (!heightmap || heightmap.length === 0) return null;

  const h = heightmap.length;
  const w = heightmap[0].length;
  const pixelSize = 0.2;
  const { baseHeight, detailHeight } = dimensions;

  // --- Part 1: Generate the Base Object (a simple box) ---
  const baseVertices: Vertex[] = [
    { x: 0, y: 0, z: 0 },
    { x: w * pixelSize, y: 0, z: 0 },
    { x: w * pixelSize, y: h * pixelSize, z: 0 },
    { x: 0, y: h * pixelSize, z: 0 },
    { x: 0, y: 0, z: baseHeight },
    { x: w * pixelSize, y: 0, z: baseHeight },
    { x: w * pixelSize, y: h * pixelSize, z: baseHeight },
    { x: 0, y: h * pixelSize, z: baseHeight },
  ];
  const baseTriangles: Triangle[] = [
    { v1: 0, v2: 1, v3: 2 }, { v1: 0, v2: 2, v3: 3 }, // Bottom
    { v1: 4, v2: 6, v3: 5 }, { v1: 4, v2: 7, v3: 6 }, // Top
    { v1: 0, v2: 4, v3: 1 }, { v1: 1, v2: 4, v3: 5 }, // Front
    { v1: 1, v2: 5, v3: 2 }, { v1: 2, v2: 5, v3: 6 }, // Right
    { v1: 2, v2: 6, v3: 3 }, { v1: 3, v2: 6, v3: 7 }, // Back
    { v1: 3, v2: 7, v3: 0 }, { v1: 0, v2: 7, v3: 4 }, // Left
  ];

  // --- Part 2: Generate the Raised Object ---
  const raisedVertices: Vertex[] = [];
  const raisedTriangles: Triangle[] = [];
  const vertexMap = new Map<string, number>();

  const getVertex = (x: number, y: number, z: number) => {
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (vertexMap.has(key)) {
      return vertexMap.get(key)!;
    }
    const index = raisedVertices.length;
    raisedVertices.push({ x: x * pixelSize, y: y * pixelSize, z });
    vertexMap.set(key, index);
    return index;
  };

  const topZ = baseHeight + detailHeight;
  const bottomZ = baseHeight;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (heightmap[y][x] === 0) { // Is a raised pixel
        const v_tl_b = getVertex(x, y, bottomZ);
        const v_tr_b = getVertex(x + 1, y, bottomZ);
        const v_bl_b = getVertex(x, y + 1, bottomZ);
        const v_br_b = getVertex(x + 1, y + 1, bottomZ);
        const v_tl_t = getVertex(x, y, topZ);
        const v_tr_t = getVertex(x + 1, y, topZ);
        const v_bl_t = getVertex(x, y + 1, topZ);
        const v_br_t = getVertex(x + 1, y + 1, topZ);

        // Top face
        raisedTriangles.push({ v1: v_tl_t, v2: v_tr_t, v3: v_bl_t });
        raisedTriangles.push({ v1: v_tr_t, v2: v_br_t, v3: v_bl_t });

        // Bottom face
        raisedTriangles.push({ v1: v_tl_b, v2: v_bl_b, v3: v_tr_b });
        raisedTriangles.push({ v1: v_tr_b, v2: v_bl_b, v3: v_br_b });

        // Top Wall (if pixel above is white or doesn't exist)
        if (y === 0 || heightmap[y - 1][x] === 255) {
          raisedTriangles.push({ v1: v_tl_b, v2: v_tr_b, v3: v_tl_t });
          raisedTriangles.push({ v1: v_tr_b, v2: v_tr_t, v3: v_tl_t });
        }
        // Bottom Wall
        if (y === h - 1 || heightmap[y + 1][x] === 255) {
          raisedTriangles.push({ v1: v_bl_b, v2: v_bl_t, v3: v_br_b });
          raisedTriangles.push({ v1: v_br_b, v2: v_bl_t, v3: v_br_t });
        }
        // Left Wall
        if (x === 0 || heightmap[y][x - 1] === 255) {
          raisedTriangles.push({ v1: v_tl_b, v2: v_tl_t, v3: v_bl_b });
          raisedTriangles.push({ v1: v_bl_b, v2: v_tl_t, v3: v_bl_t });
        }
        // Right Wall
        if (x === w - 1 || heightmap[y][x + 1] === 255) {
          raisedTriangles.push({ v1: v_tr_b, v2: v_br_b, v3: v_tr_t });
          raisedTriangles.push({ v1: v_br_b, v2: v_br_t, v3: v_tr_t });
        }
      }
    }
  }

  // --- Part 3: Assemble the XML ---
  const baseVerticesXML = baseVertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
  const baseTrianglesXML = baseTriangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');

  const raisedVerticesXML = raisedVertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
  const raisedTrianglesXML = raisedTriangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
   <basematerials id="1">
     <base name="Raised Detail" displaycolor="${colors.raisedColor}" />
     <base name="Base" displaycolor="${colors.baseColor}" />
   </basematerials>
   <object id="2" name="Base" type="model" pid="1" pindex="1">
     <mesh>
       <vertices>${baseVerticesXML}</vertices>
       <triangles>${baseTrianglesXML}</triangles>
     </mesh>
   </object>
   <object id="3" name="Raised Detail" type="model" pid="1" pindex="0">
     <mesh>
       <vertices>${raisedVerticesXML}</vertices>
       <triangles>${raisedTrianglesXML}</triangles>
     </mesh>
   </object>
 </resources>
 <build>
   <item objectid="2" />
   <item objectid="3" />
 </build>
</model>`;
}
