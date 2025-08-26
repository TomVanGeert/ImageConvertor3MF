import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken } from "../../../lib/serverUtils";

// Use same in-memory DB as above
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  sessionToken?: string;
}

const users: User[] = [];

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const user = users.find(u => u.email === email);
    if (!user) return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

    const token = generateToken();
    user.sessionToken = token;

    const response = NextResponse.json({ message: "Login successful", user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set("session", token, { httpOnly: true, path: "/" });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
