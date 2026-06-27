import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getSessionUser(request);
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await readDb();

    // Map users to response format
    const users = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      emailVerified: u.isVerified,
      image: u.imageUrl,
      role: u.role,
      status: u.isFraud ? "fraud" : "active",
      contactNumber: u.contactNumber || "",
      address: u.address || "",
      generatedAt: u.generatedAt || new Date().toISOString(),
      updatedAt: u.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("GET all users error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
