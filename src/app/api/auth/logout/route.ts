import { NextResponse } from "next/server";
import { deleteSession } from "../sessions/route";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies(); // <- await here
  const token = cookieStore.get("sessionToken")?.value;

  if (token) deleteSession(token);

  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("sessionToken", "", { path: "/", maxAge: 0 });
  return res;
}
