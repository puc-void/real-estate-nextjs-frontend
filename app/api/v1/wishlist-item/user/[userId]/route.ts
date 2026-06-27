import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const db = await readDb();

    const data = db.wishlist
      .filter((w) => w.userId === userId)
      .map((w) => {
        const property = db.properties.find((p) => p.id === w.propertyId);
        const agentUser = property ? db.users.find((u) => u.agentId === property.agentId) : null;

        return {
          id: w.id.toString(),
          wishlistId: userId,
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
      });

    return NextResponse.json({
      success: true,
      message: "Wishlist items retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET user wishlist error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
