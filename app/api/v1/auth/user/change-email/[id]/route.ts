import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Otp } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Check if email already in use
    const emailExists = db.users.some(
      (u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: "Email already in use" },
        { status: 400 }
      );
    }

    const user = db.users.find((u) => u.id === id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.email = email;
    user.isVerified = false; // Requires verification
    user.updatedAt = new Date().toISOString();

    // Create a new OTP
    const mockOtp: Otp = {
      id: crypto.randomUUID(),
      userId: user.id,
      otp: "123456", // Default OTP
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      email: email,
    };
    db.otps.push(mockOtp);

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Email Changed Successfully and otp send",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        emailVerified: false,
        image: user.imageUrl,
        role: user.role,
        status: user.isFraud ? "fraud" : "active",
        contactNumber: user.contactNumber || "",
        address: user.address || "",
        generatedAt: user.generatedAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Change email error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
