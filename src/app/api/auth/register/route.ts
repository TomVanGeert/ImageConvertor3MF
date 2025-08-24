import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import crypto from "crypto";

const usersFile = path.join(process.cwd(), "data", "users.json");

// Ensure users.json exists
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

export async function POST(req: Request) {
  const { name, email, password }: { name: string; email: string; password: string } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const users = JSON.parse(fs.readFileSync(usersFile, "utf8") || "[]");

  if (users.find((u: any) => u.email === email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password, // In production, **hash passwords** with bcrypt or argon2
  };

  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  return NextResponse.json({ message: "User registered", userId: newUser.id });
}
