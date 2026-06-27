import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password, newPassword } = body as { password?: string; newPassword?: string };

    if (!password || !newPassword || password.length < 6 || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Passwords must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await readDb();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: "Current password does not match" },
        { status: 400 }
      );
    }

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();

    // Create password change notification for admin
    db.notifications.push({
      id: crypto.randomUUID(),
      title: "Changing Password",
      message: `${user.name} changed his password`,
      receiverId: null,
      receiverRole: "ADMIN",
      generatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Email Changed Successfully and otp send", // Spec says "Email Changed Successfully and otp send" in Response Body
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
        generatedAt: user.generatedAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
