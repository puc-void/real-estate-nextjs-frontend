import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, WishlistItem } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);
    const db = await readDb();

    const w = db.wishlist.find((item) => item.id === itemId);
    if (!w) {
      return NextResponse.json(
        { success: false, message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    const property = db.properties.find((p) => p.id === w.propertyId);
    const agentUser = property ? db.users.find((u) => u.agentId === property.agentId) : null;

    const data = {
      id: w.id.toString(),
      wishlistId: w.userId,
      propertyId: w.propertyId,
      agentId: property ? property.agentId : "",
      addedAt: new Date().toISOString(),
      property: property ? {
        id: property.id,
        agentId: property.agentId,
        title: property.title,
        description: property.description,
        imageUrl: property.imageUrl,
        location: property.location,
        priceRange: property.priceRange,
        propertyType: property.propertyType,
        isVerified: property.isVerified,
        isAdvertised: property.isAdvertised,
        isBought: property.isBought,
        generatedAt: property.generatedAt,
        updatedAt: property.updatedAt,
      } : null,
      agent: agentUser ? {
        id: agentUser.agentId || agentUser.id,
        userId: agentUser.id,
        isVerified: agentUser.isVerified,
        isFraud: agentUser.isFraud,
      } : null,
    };

    return NextResponse.json({
      success: true,
      message: "Wishlist item retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET wishlist item detail error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { propertyId, agentId } = body as { propertyId: number; agentId: string };

    if (!propertyId || !agentId) {
      return NextResponse.json(
        { success: false, message: "Missing propertyId or agentId" },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Check if already in wishlist
    const exists = db.wishlist.some(
      (w) => w.userId === userId && w.propertyId === propertyId
    );

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Property already in wishlist" },
        { status: 400 }
      );
    }

    const newItem: WishlistItem = {
      id: db.wishlist.length > 0 ? Math.max(...db.wishlist.map((w) => w.id)) + 1 : 1,
      userId,
      propertyId,
    };

    db.wishlist.push(newItem);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Wishlist item added successfully",
      data: {
        id: newItem.id.toString(),
        wishlistId: userId,
        propertyId: newItem.propertyId,
        agentId,
        addedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST wishlist item error:", error);
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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);
    const db = await readDb();

    const index = db.wishlist.findIndex((item) => item.id === itemId);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    const w = db.wishlist[index];
    db.wishlist.splice(index, 1);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Wishlist item deleted successfully",
      data: {
        id: w.id.toString(),
        wishlistId: w.userId,
        propertyId: w.propertyId,
        agentId: db.properties.find((p) => p.id === w.propertyId)?.agentId || "",
        addedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("DELETE wishlist item error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
