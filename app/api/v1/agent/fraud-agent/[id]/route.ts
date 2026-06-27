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
    const { isFraud } = body as { isFraud: boolean };

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

    agentUser.isFraud = isFraud;
    
    if (isFraud) {
      // Flagging them as fraud unverifies them
      agentUser.isVerified = false;

      // Unverify all their properties
      const agentIdStr = agentUser.agentId;
      if (agentIdStr) {
        db.properties = db.properties.map((p) => {
          if (p.agentId === agentIdStr) {
            return { ...p, isVerified: false, isAdvertised: false };
          }
          return p;
        });
      }
    }

    agentUser.updatedAt = new Date().toISOString();
    await writeDb(db);

    const msg = isFraud
      ? "Agent marked as fraud successfully and unverified"
      : "Agent marked as UnFraud successfully";

    return NextResponse.json({
      success: true,
      message: msg,
      data: {
        id: agentUser.agentId || agentUser.id,
        userId: agentUser.id,
        isVerified: agentUser.isVerified,
        isFraud: agentUser.isFraud,
      },
    });
  } catch (error) {
    console.error("PUT fraud-agent error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
