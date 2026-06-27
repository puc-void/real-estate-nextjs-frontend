import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getSessionUser(request);
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isVerified } = body as { isVerified: boolean };

    const db = await readDb();
    const agentUser = db.users.find(
      (u) => (u.agentId === id || u.id === id) && u.role === "AGENT"
    );

    if (!agentUser) {
      return NextResponse.json(
        { success: false, message: "Agent not found" },
        { status: 404 }
      );
    }

    agentUser.isVerified = isVerified;
    agentUser.updatedAt = new Date().toISOString();

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Agent verified successfully",
      data: {
        id: agentUser.agentId || agentUser.id,
        userId: agentUser.id,
        isVerified: agentUser.isVerified,
        isFraud: agentUser.isFraud,
      },
    });
  } catch (error) {
    console.error("PUT verify-agent error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
