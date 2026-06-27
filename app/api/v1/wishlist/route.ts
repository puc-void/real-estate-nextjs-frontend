import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, WishlistItem } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await readDb();

    // Get all wishlist items for this user
    const userWishlist = db.wishlist.filter((w) => w.userId === user.id);

    // Map to include property details
    const wishlistWithProperties = userWishlist
      .map((item) => {
        const prop = db.properties.find((p) => p.id === item.propertyId);
        if (!prop) return null;

        // Fetch agent info for the property too
        const agentUser = db.users.find((u) => u.agentId === prop.agentId);
        return {
          id: item.id,
          propertyId: item.propertyId,
          property: {
            ...prop,
            agent: agentUser
              ? {
                  id: agentUser.agentId,
                  userId: agentUser.id,
                  isVerified: agentUser.isVerified,
                  isFraud: agentUser.isFraud,
                }
              : null,
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: wishlistWithProperties,
    });
  } catch (error) {
    console.error("GET wishlist error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: "Property ID is required" },
        { status: 400 }
      );
    }

    const db = await readDb();
    
    // Check if property exists
    const propertyExists = db.properties.some((p) => p.id === Number(propertyId));
    if (!propertyExists) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    // Toggle logic: check if already exists
    const index = db.wishlist.findIndex(
      (w) => w.userId === user.id && w.propertyId === Number(propertyId)
    );

    if (index > -1) {
      // Remove
      db.wishlist.splice(index, 1);
      await writeDb(db);
      return NextResponse.json({
        success: true,
        message: "Property removed from wishlist",
        isWishlisted: false,
      });
    } else {
      // Add
      const nextId = db.wishlist.length > 0 ? Math.max(...db.wishlist.map((w) => w.id)) + 1 : 1;
      const newItem: WishlistItem = {
        id: nextId,
        userId: user.id,
        propertyId: Number(propertyId),
      };
      db.wishlist.push(newItem);
      await writeDb(db);
      return NextResponse.json({
        success: true,
        message: "Property added to wishlist",
        isWishlisted: true,
      });
    }
  } catch (error) {
    console.error("POST wishlist error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
