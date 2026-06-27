import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Otp } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, name } = body as { email: string; userId: string; name: string };

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Remove any existing OTP for this user
    db.otps = db.otps.filter((o) => o.userId !== userId);

    // Create a new OTP
    const mockOtp: Otp = {
      id: crypto.randomUUID(),
      userId: userId,
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
      message: "OTP Resend Successfully",
      data: {
        id: mockOtp.id,
        userId: mockOtp.userId,
        otp: mockOtp.otp,
        expiresAt: mockOtp.expiresAt,
        generatedAt: mockOtp.generatedAt,
        updatedAt: mockOtp.updatedAt,
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
