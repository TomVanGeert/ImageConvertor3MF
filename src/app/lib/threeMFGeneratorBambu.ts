// src/app/lib/threeMFGeneratorBambu.ts

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
 'Metadata/model_settings.config': string;
};

// --- GEOMETRY HELPER (Now with Y-axis correction and hole punching) ---
function generateGeometry(heightmap: number[][], dimensions: Dimensions, width: number, height: number) {
 const { baseHeight, detailHeight } = dimensions;
 const h = heightmap.length;
 const w = heightmap[0].length;
 const pixelSizeWidth = width / w;
 const pixelSizeHeight = height / h;

 // --- MODIFICATION 1: Invert Y-coordinates for the base plate ---
 // The base geometry will be built differently now to accommodate holes.
 // We'll generate it dynamically along with the raised details.
 const baseVertices: Vertex[] = [];
 const baseTriangles: Triangle[] = [];
 const baseVertexMap = new Map<string, number>();

 const getBaseVertex = (x: number, y: number, z: number): number => {
   const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
   if (baseVertexMap.has(key)) { return baseVertexMap.get(key)!; }
   const index = baseVertices.length;
   baseVertices.push({ x, y, z });
   baseVertexMap.set(key, index);
   return index;
 };
 
 // Raised Object Geometry
 const raisedVertices: Vertex[] = [];
 const raisedTriangles: Triangle[] = [];
 const raisedVertexMap = new Map<string, number>();

 const getRaisedVertex = (x: number, y: number, z: number): number => {
   const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
   if (raisedVertexMap.has(key)) { return raisedVertexMap.get(key)!; }
   const index = raisedVertices.length;
   // Invert Y-coordinate for raised details
   const correctedY = height - (y * pixelSizeHeight);
   raisedVertices.push({ x: x * pixelSizeWidth, y: correctedY, z });
   raisedVertexMap.set(key, index);
   return index;
 };

 const topZ = baseHeight + detailHeight;
 const bottomZ = baseHeight;

 // Loop through the grid to generate both base and raised parts
 for (let y = 0; y < h; y++) {
   for (let x = 0; x < w; x++) {

     // --- START: CRITICAL CHANGE FOR HOLE PUNCHING ---
     // If the current pixel is a hole (-1), skip ALL geometry generation for this pixel.
     if (heightmap[y][x] === -1) {
       continue; 
     }
     // --- END: CRITICAL CHANGE FOR HOLE PUNCHING ---
     
     // --- Generate Base Geometry for non-hole pixels ---
     const x_coord = x * pixelSizeWidth;
     const y_coord = height - (y * pixelSizeHeight); // Inverted Y

     // Get vertices for this quad of the base
     const v0 = getBaseVertex(x_coord, y_coord, 0);
     const v1 = getBaseVertex(x_coord + pixelSizeWidth, y_coord, 0);
     const v2 = getBaseVertex(x_coord + pixelSizeWidth, y_coord - pixelSizeHeight, 0);
     const v3 = getBaseVertex(x_coord, y_coord - pixelSizeHeight, 0);

     const v4 = getBaseVertex(x_coord, y_coord, baseHeight);
     const v5 = getBaseVertex(x_coord + pixelSizeWidth, y_coord, baseHeight);
     const v6 = getBaseVertex(x_coord + pixelSizeWidth, y_coord - pixelSizeHeight, baseHeight);
     const v7 = getBaseVertex(x_coord, y_coord - pixelSizeHeight, baseHeight);

     // Bottom and Top faces of this base pixel
     baseTriangles.push({ v1: v0, v2: v1, v3: v2 }, { v1: v0, v2: v2, v3: v3 });
     baseTriangles.push({ v1: v4, v2: v6, v3: v5 }, { v1: v4, v2: v7, v3: v6 });
     
     // Side walls (only if neighbor is a hole or edge)
     if (y === 0 || heightmap[y - 1][x] === -1) { baseTriangles.push({ v1: v4, v2: v5, v3: v1 }, { v1: v4, v2: v1, v3: v0 }); } // Top edge
     if (y === h - 1 || heightmap[y + 1][x] === -1) { baseTriangles.push({ v1: v7, v2: v2, v3: v6 }, { v1: v7, v2: v3, v3: v2 }); } // Bottom edge
     if (x === 0 || heightmap[y][x - 1] === -1) { baseTriangles.push({ v1: v4, v2: v0, v3: v3 }, { v1: v4, v2: v3, v3: v7 }); } // Left edge
     if (x === w - 1 || heightmap[y][x + 1] === -1) { baseTriangles.push({ v1: v5, v2: v6, v3: v2 }, { v1: v5, v2: v2, v3: v1 }); } // Right edge


     // --- Generate Raised Geometry (if applicable) ---
     if (heightmap[y][x] === 0) { // Is a raised pixel
       const v_tl_b = getRaisedVertex(x, y, bottomZ), v_tr_b = getRaisedVertex(x + 1, y, bottomZ), v_bl_b = getRaisedVertex(x, y + 1, bottomZ), v_br_b = getRaisedVertex(x + 1, y + 1, bottomZ);
       const v_tl_t = getRaisedVertex(x, y, topZ), v_tr_t = getRaisedVertex(x + 1, y, topZ), v_bl_t = getRaisedVertex(x, y + 1, topZ), v_br_t = getRaisedVertex(x + 1, y + 1, topZ);
       raisedTriangles.push({ v1: v_tl_t, v2: v_tr_t, v3: v_bl_t }, { v1: v_tr_t, v2: v_br_t, v3: v_bl_t }); // Top
       raisedTriangles.push({ v1: v_tl_b, v2: v_bl_b, v3: v_tr_b }, { v1: v_tr_b, v2: v_bl_b, v3: v_br_b }); // Bottom
       
       // Raised Walls (only if neighbor is NOT raised)
       if (y === 0 || heightmap[y - 1][x] === 255 || heightmap[y-1][x] === -1) { raisedTriangles.push({ v1: v_tl_b, v2: v_tr_b, v3: v_tl_t }, { v1: v_tr_b, v2: v_tr_t, v3: v_tl_t }); }
       if (y === h - 1 || heightmap[y + 1][x] === 255 || heightmap[y + 1][x] === -1) { raisedTriangles.push({ v1: v_bl_b, v2: v_bl_t, v3: v_br_b }, { v1: v_br_b, v2: v_bl_t, v3: v_br_t }); }
       if (x === 0 || heightmap[y][x - 1] === 255 || heightmap[y][x - 1] === -1) { raisedTriangles.push({ v1: v_tl_b, v2: v_tl_t, v3: v_bl_b }, { v1: v_bl_b, v2: v_tl_t, v3: v_bl_t }); }
       if (x === w - 1 || heightmap[y][x + 1] === 255 || heightmap[y][x + 1] === -1) { raisedTriangles.push({ v1: v_tr_b, v2: v_br_b, v3: v_tr_t }, { v1: v_br_b, v2: v_br_t, v3: v_tr_t }); }
     }
   }
 }
 return { baseVertices, baseTriangles, raisedVertices, raisedTriangles };
}

// --- MAIN BAMBU 3MF GENERATOR ---
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

 // File 1: The model itself.
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

 // File 2: The model_settings.config file.
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

 // File 3: The relationship file for the model.
 const modelRelsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Target="/Metadata/model_settings.config" Id="rel-settings" Type="http://schemas.bambulab.com/3mf/2023/01/bambu-studio-project"/>
</Relationships>`;

 // File 4 & 5: Boilerplate files.
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
