import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserId } from "../sessions/route";

const usersFile = path.join(process.cwd(), "data", "users.json");

export async function GET() {
  const cookieStore = cookies(); // ✅ no await, no extra typing
  const token = cookieStore.get("sessionToken")?.value;

  if (!token) return NextResponse.json({ user: null });

  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ user: null });

  const users = JSON.parse(fs.readFileSync(usersFile, "utf8") || "[]");
  const user = users.find((u: any) => u.id === userId);

  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
