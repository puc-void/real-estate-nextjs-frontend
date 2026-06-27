import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { signJwt } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await readDb();

    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.role === "AGENT" && user.isFraud) {
      return NextResponse.json(
        { success: false, message: "Your agent account has been flagged as fraud. Access denied." },
        { status: 403 }
      );
    }

    // Sign token
    const token = await signJwt({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      agentId: user.agentId,
    });

    const response = NextResponse.json({
      success: true,
      message: "User signed in successfully",
      token: token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        emailVerified: user.isVerified,
        image: user.imageUrl,
        role: user.role,
        status: user.isFraud ? "fraud" : "active",
        contactNumber: user.contactNumber || "",
        address: user.address || "",
        generatedAt: user.generatedAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      },
    });

    // Set HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
