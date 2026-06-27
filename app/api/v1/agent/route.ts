import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const db = await readDb();
    const agents = db.users
      .filter((u) => u.role === "AGENT")
      .map((u) => ({
        id: u.agentId || u.id,
        userId: u.id,
        isVerified: u.isVerified,
        isFraud: u.isFraud,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.isVerified,
          image: u.imageUrl,
          role: u.role,
          status: u.isFraud ? "fraud" : "active",
          contactNumber: u.contactNumber || "",
          address: u.address || "",
          generatedAt: u.generatedAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString(),
        },
      }));

    return NextResponse.json({
      success: true,
      message: "Agents retrieved successfully",
      data: agents,
    });
  } catch (error) {
    console.error("GET agents error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
