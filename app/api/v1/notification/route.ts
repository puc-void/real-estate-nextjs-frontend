import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await readDb();

    return NextResponse.json({
      success: true,
      message: "Notifications retrieved successfully",
      data: db.notifications,
    });
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
