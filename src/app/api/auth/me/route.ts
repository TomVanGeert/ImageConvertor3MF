import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/auth-options";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({ user: session.user });
}
