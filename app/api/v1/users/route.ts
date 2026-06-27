import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin only." },
        { status: 403 }
      );
    }

    const db = await readDb();

    // Map to exclude password
    const users = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      isFraud: u.isFraud,
      imageUrl: u.imageUrl,
      agentId: u.agentId,
    }));

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
