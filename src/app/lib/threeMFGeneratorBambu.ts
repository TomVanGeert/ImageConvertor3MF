import { PRINT_COLOR_RAISED, PRINT_COLOR_BASE } from './constants';

// --- TYPE DEFINITIONS ---
type Vertex = { x: number; y: number; z: number };
type Triangle = { v1: number; v2: number; v3: number };
type Dimensions = { baseHeight: number; detailHeight: number };

/**
* The final, correct archive structure for a Bambu Studio project file.
*/
type Bambu3mfArchive = {
  '[Content_Types].xml': string;
  '_rels/.rels': string;
  '3D/3dmodel.model': string;
  '3D/_rels/3dmodel.model.rels': string;
  'Metadata/model_settings.config': string; // <-- The new, correct config file
};

// --- GEOMETRY HELPER (Now with Y-axis correction) ---
function generateGeometry(heightmap: number[][], dimensions: Dimensions, width: number, height: number) {
  const { baseHeight, detailHeight } = dimensions;
  const h = heightmap.length;
  const w = heightmap[0].length;
  const pixelSizeWidth = width / w;
  const pixelSizeHeight = height / h;

  // --- MODIFICATION 1: Invert Y-coordinates for the base plate ---
  const baseVertices: Vertex[] = [
    // Bottom face of the base (z=0)
    { x: 0, y: height, z: 0 },             // Top-left on build plate
    { x: width, y: height, z: 0 }, // Top-right
    { x: width, y: 0, z: 0 },             // Bottom-right
    { x: 0, y: 0, z: 0 },                         // Bottom-left
    // Top face of the base (z=baseHeight)
    { x: 0, y: height, z: baseHeight },    // Top-left
    { x: width, y: height, z: baseHeight },// Top-right
    { x: width, y: 0, z: baseHeight },    // Bottom-right
    { x: 0, y: 0, z: baseHeight },                // Bottom-left
  ];
  // The baseTriangles definition does not need to change, as it just references vertex indices.
  const baseTriangles: Triangle[] = [
    { v1: 0, v2: 1, v3: 2 }, { v1: 0, v2: 2, v3: 3 }, // Bottom
    { v1: 4, v2: 6, v3: 5 }, { v1: 4, v2: 7, v3: 6 }, // Top
    { v1: 0, v2: 4, v3: 1 }, { v1: 1, v2: 4, v3: 5 }, // Front
    { v1: 1, v2: 5, v3: 2 }, { v1: 2, v2: 5, v3: 6 }, // Right
    { v1: 2, v2: 6, v3: 3 }, { v1: 3, v2: 6, v3: 7 }, // Back
    { v1: 3, v2: 7, v3: 0 }, { v1: 0, v2: 7, v3: 4 }, // Left
  ];

  // Raised Object Geometry
  const raisedVertices: Vertex[] = [];
  const raisedTriangles: Triangle[] = [];
  const vertexMap = new Map<string, number>();

  const getVertex = (x: number, y: number, z: number): number => {
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (vertexMap.has(key)) { return vertexMap.get(key)!; }
    const index = raisedVertices.length;

    // --- MODIFICATION 2: Invert Y-coordinate for raised details ---
    const correctedY = height - (y * pixelSizeHeight);
    raisedVertices.push({ x: x * pixelSizeWidth, y: correctedY, z });

    vertexMap.set(key, index);
    return index;
  };

  const topZ = baseHeight + detailHeight;
  const bottomZ = baseHeight;

  // The loop logic remains the same
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (heightmap[y][x] === 0) { // Is a raised pixel
        const v_tl_b = getVertex(x, y, bottomZ), v_tr_b = getVertex(x + 1, y, bottomZ), v_bl_b = getVertex(x, y + 1, bottomZ), v_br_b = getVertex(x + 1, y + 1, bottomZ);
        const v_tl_t = getVertex(x, y, topZ), v_tr_t = getVertex(x + 1, y, topZ), v_bl_t = getVertex(x, y + 1, topZ), v_br_t = getVertex(x + 1, y + 1, topZ);
        raisedTriangles.push({ v1: v_tl_t, v2: v_tr_t, v3: v_bl_t }, { v1: v_tr_t, v2: v_br_t, v3: v_bl_t });
        raisedTriangles.push({ v1: v_tl_b, v2: v_bl_b, v3: v_tr_b }, { v1: v_tr_b, v2: v_bl_b, v3: v_br_b });
        if (y === 0 || heightmap[y - 1][x] === 255) { raisedTriangles.push({ v1: v_tl_b, v2: v_tr_b, v3: v_tl_t }, { v1: v_tr_b, v2: v_tr_t, v3: v_tl_t }); }
        if (y === h - 1 || heightmap[y + 1][x] === 255) { raisedTriangles.push({ v1: v_bl_b, v2: v_bl_t, v3: v_br_b }, { v1: v_br_b, v2: v_bl_t, v3: v_br_t }); }
        if (x === 0 || heightmap[y][x - 1] === 255) { raisedTriangles.push({ v1: v_tl_b, v2: v_tl_t, v3: v_bl_b }, { v1: v_bl_b, v2: v_tl_t, v3: v_bl_t }); }
        if (x === w - 1 || heightmap[y][x + 1] === 255) { raisedTriangles.push({ v1: v_tr_b, v2: v_br_b, v3: v_tr_t }, { v1: v_br_b, v2: v_br_t, v3: v_tr_t }); }
      }
    }
  }
  return { baseVertices, baseTriangles, raisedVertices, raisedTriangles };
}

// --- MAIN BAMBU 3MF GENERATOR (FINAL VERSION) ---
export function generateBambu3mf(
  heightmap: number[][],
  dimensions: Dimensions,
  newDimensions: { width: number, height: number }
): Bambu3mfArchive | null {
  if (!heightmap || heightmap.length === 0) return null;

  const { baseVertices, baseTriangles, raisedVertices, raisedTriangles } =
    generateGeometry(heightmap, dimensions, newDimensions.width, newDimensions.height);

  // --- XML Generation ---
  const baseVerticesXML = baseVertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
  const baseTrianglesXML = baseTriangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');
  const raisedVerticesXML = raisedVertices.map(v => `<vertex x="${v.x}" y="${v.y}" z="${v.z}" />`).join('\n');
  const raisedTrianglesXML = raisedTriangles.map(t => `<triangle v1="${t.v1}" v2="${t.v2}" v3="${t.v3}" />`).join('\n');

  // --- FILE CONTENT GENERATION ---

  // File 1: The model itself. Now it's a "pure" 3MF without Bambu-specific attributes.
  const modelFileContent = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <resources>
   <object id="2" name="Base" type="model">
     <mesh><vertices>${baseVerticesXML}</vertices><triangles>${baseTrianglesXML}</triangles></mesh>
   </object>
   <object id="3" name="Raised Detail" type="model">
     <mesh><vertices>${raisedVerticesXML}</vertices><triangles>${raisedTrianglesXML}</triangles></mesh>
   </object>
 </resources>
 <build>
   <item objectid="2" /><item objectid="3" />
 </build>
</model>`;

  // File 2: The new model_settings.config file. This is the key.
  const modelSettingsContent = `<?xml version="1.0" encoding="UTF-8"?>
<config>
 <version>1.9</version>
 <filaments>
   <filament id="0" type="PLA" color_hex="${PRINT_COLOR_BASE}" />
   <filament id="1" type="PLA" color_hex="${PRINT_COLOR_RAISED}" />
 </filaments>
 <object id="2">
   <metadata key="name" value="Base"/>
   <metadata key="extruder" value="1"/>
 </object>
 <object id="3">
   <metadata key="name" value="Raised Detail"/>
   <metadata key="extruder" value="2"/>
 </object>
</config>`;

  // File 3: The relationship file for the model, pointing to our new config file.
  const modelRelsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/Metadata/model_settings.config" Id="rel-settings" Type="http://schemas.bambulab.com/3mf/2023/01/bambu-studio-project"/>
</Relationships>`;

  // File 4 & 5: Boilerplate files, unchanged.
  const contentTypesFileContent = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 <Default Extension="config" ContentType="application/xml"/>
</Types>`;

  const rootRelsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel-model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  return {
    '[Content_Types].xml': contentTypesFileContent,
    '_rels/.rels': rootRelsContent,
    '3D/3dmodel.model': modelFileContent,
    '3D/_rels/3dmodel.model.rels': modelRelsContent,
    'Metadata/model_settings.config': modelSettingsContent,
  };
}
