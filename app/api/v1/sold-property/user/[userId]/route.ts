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

    // Filter sold properties for this user
    const data = db.soldProperties
      .filter((sp) => sp.userId === userId)
      .map((sp) => {
        const property = db.properties.find((p) => p.id === sp.propertyId);
        const buyer = db.users.find((u) => u.id === sp.userId);
        const agentUser = db.users.find((u) => u.agentId === sp.agentId);

        return {
          id: sp.id,
          bookedPropertyId: sp.bookedPropertyId,
          propertyId: sp.propertyId,
          userId: sp.userId,
          agentId: sp.agentId,
          amount: sp.amount,
          soldAt: sp.soldAt,
          updatedAt: sp.updatedAt,
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
          user: buyer ? {
            id: buyer.id,
            name: buyer.name,
            email: buyer.email,
            image: buyer.imageUrl,
          } : null,
        };
      });

    return NextResponse.json({
      success: true,
      message: "Sold properties retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET user sold properties error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
