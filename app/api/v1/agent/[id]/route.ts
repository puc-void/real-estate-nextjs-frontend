import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    const agentData = {
      id: agentUser.agentId || agentUser.id,
      userId: agentUser.id,
      isVerified: agentUser.isVerified,
      isFraud: agentUser.isFraud,
      user: {
        id: agentUser.id,
        name: agentUser.name,
        email: agentUser.email,
        emailVerified: agentUser.isVerified,
        image: agentUser.imageUrl,
        role: agentUser.role,
        status: agentUser.isFraud ? "fraud" : "active",
        contactNumber: agentUser.contactNumber || "",
        address: agentUser.address || "",
        generatedAt: agentUser.generatedAt || new Date().toISOString(),
        updatedAt: agentUser.updatedAt || new Date().toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      message: "Agent details retrieved successfully",
      data: agentData,
    });
  } catch (error) {
    console.error("GET agent details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = await readDb();
    const agentIndex = db.users.findIndex(
      (u) => (u.agentId === id || u.id === id) && u.role === "AGENT"
    );

    if (agentIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Agent not found" },
        { status: 404 }
      );
    }

    const agentUser = db.users[agentIndex];

    // Remove agent from users
    db.users.splice(agentIndex, 1);

    // Also remove properties listed by this agent
    const agentIdStr = agentUser.agentId || "";
    db.properties = db.properties.filter((p) => p.agentId !== agentIdStr);

    // Remove matching offers
    db.offers = db.offers.filter((o) => o.buyerEmail !== agentUser.email);

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
      data: {
        id: agentUser.agentId || agentUser.id,
        userId: agentUser.id,
        isVerified: agentUser.isVerified,
        isFraud: agentUser.isFraud,
      },
    });
  } catch (error) {
    console.error("DELETE agent error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
