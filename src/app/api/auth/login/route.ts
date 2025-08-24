import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "../sessions/route";

const usersFile = path.join(process.cwd(), "data", "users.json");

export async function POST(req: Request) {
  const { email, password }: { email: string; password: string } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const users = JSON.parse(fs.readFileSync(usersFile, "utf8") || "[]");
  const user = users.find((u: any) => u.email === email && u.password === password);

  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = createSession(user.id);

  const res = NextResponse.json({ message: "Logged in", user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set("sessionToken", token, { path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });

  return res;
}
