// src/app/api/upload-image/route.ts
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { imageData, name } = await req.json();

    if (!imageData || !name) return new Response("Missing data", { status: 400 });

    // Ensure uploads folder exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const base64 = imageData.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const filename = `${Date.now()}-${name.replace(/\s+/g, "-")}.png`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    return new Response(JSON.stringify({ url: `/uploads/${filename}` }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Failed to upload image", { status: 500 });
  }
}
