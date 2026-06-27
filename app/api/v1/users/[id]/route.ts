import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin only." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isVerified, isFraud } = body as { isVerified?: boolean; isFraud?: boolean };

    const db = await readDb();
    const userIndex = db.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const user = db.users[userIndex];

    if (isVerified !== undefined) {
      user.isVerified = isVerified;
    }

    if (isFraud !== undefined) {
      user.isFraud = isFraud;
      if (isFraud && user.role === "AGENT") {
        // If an agent is fraud, unverify their properties and make them unadvertised
        db.properties = db.properties.map((p) => {
          if (p.agentId === user.agentId) {
            return { ...p, isVerified: false, isAdvertised: false };
          }
          return p;
        });
      }
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "User status updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isFraud: user.isFraud,
      },
    });
  } catch (error) {
    console.error("PUT user error:", error);
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
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin only." },
        { status: 403 }
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

    const deletedUser = db.users.splice(userIndex, 1)[0];

    // If they were an agent, remove their properties and offers
    if (deletedUser.role === "AGENT" && deletedUser.agentId) {
      const agentProps = db.properties.filter((p) => p.agentId === deletedUser.agentId);
      const agentPropsIds = agentProps.map((p) => p.id);

      db.properties = db.properties.filter((p) => p.agentId !== deletedUser.agentId);
      db.offers = db.offers.filter((o) => !agentPropsIds.includes(o.propertyId));
      db.wishlist = db.wishlist.filter((w) => !agentPropsIds.includes(w.propertyId));
    }

    // Also remove any offers they made as a user
    db.offers = db.offers.filter((o) => o.userId !== id);
    db.wishlist = db.wishlist.filter((w) => w.userId !== id);

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
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
