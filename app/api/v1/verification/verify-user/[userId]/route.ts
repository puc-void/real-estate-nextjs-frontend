import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { otp } = body as { otp: string };

    const db = await readDb();

    // Find OTP record
    const otpIndex = db.otps.findIndex(
      (o) => o.userId === userId && o.otp === otp
    );

    if (otpIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code", data: {} },
        { status: 400 }
      );
    }

    const otpRecord = db.otps[otpIndex];
    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, message: "OTP has expired", data: {} },
        { status: 400 }
      );
    }

    // Mark user verified
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.isVerified = true;
      user.updatedAt = new Date().toISOString();
    }

    // Remove OTP record
    db.otps.splice(otpIndex, 1);

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "User verified successfully",
      data: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", data: {} },
      { status: 500 }
    );
  }
}
