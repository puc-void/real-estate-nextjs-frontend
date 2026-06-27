import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDb();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User details retrieved successfully",
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
    console.error("GET user details error:", error);
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
    const adminUser = await getSessionUser(request);
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = await readDb();
    const userIndex = db.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const user = db.users[userIndex];
    db.users.splice(userIndex, 1);

    // If agent, delete properties and offers
    if (user.role === "AGENT") {
      const agentIdStr = user.agentId || "";
      db.properties = db.properties.filter((p) => p.agentId !== agentIdStr);
    }

    // Add admin notification
    db.notifications.push({
      id: crypto.randomUUID(),
      title: "User Deleted",
      message: `${user.name} deleted by Admin`,
      receiverId: null,
      receiverRole: "ADMIN",
      generatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        emailVerified: user.isVerified,
        image: user.imageUrl,
        role: user.role,
        status: "active",
        contactNumber: user.contactNumber || "",
        address: user.address || "",
        generatedAt: user.generatedAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
