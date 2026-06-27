import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, BookedProperty } from "@/lib/db";
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

    // Map booked properties with joins
    const data = db.bookedProperties.map((bp) => {
      const property = db.properties.find((p) => p.id === bp.propertyId);
      const buyer = db.users.find((u) => u.id === bp.userId);
      const agentUser = db.users.find((u) => u.agentId === bp.agentId);

      return {
        id: bp.id,
        propertyId: bp.propertyId,
        userId: bp.userId,
        agentId: bp.agentId,
        proposedAmount: bp.proposedAmount,
        isPropAmountAccepted: bp.isPropAmountAccepted,
        isSold: bp.isSold,
        bookedAt: bp.bookedAt,
        updatedAt: bp.updatedAt,
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
      message: "Booked properties retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET booked properties error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "USER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Buyer access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, proposedAmount } = body as {
      propertyId: number;
      proposedAmount: string;
    };

    if (!propertyId || !proposedAmount) {
      return NextResponse.json(
        { success: false, message: "Missing propertyId or proposedAmount" },
        { status: 400 }
      );
    }

    const db = await readDb();
    const property = db.properties.find((p) => p.id === propertyId);

    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    const newBooking: BookedProperty = {
      id: db.bookedProperties.length > 0 ? Math.max(...db.bookedProperties.map((bp) => bp.id)) + 1 : 1,
      propertyId,
      userId: user.id,
      agentId: property.agentId,
      proposedAmount,
      isPropAmountAccepted: false,
      isSold: false,
      bookedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.bookedProperties.push(newBooking);

    // Create notification for agent
    db.notifications.push({
      id: crypto.randomUUID(),
      title: "New Property Booked",
      message: "Check your property list",
      receiverId: property.agentId,
      receiverRole: "AGENT",
      generatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Property booked successfully",
      data: newBooking,
    }, { status: 201 });
  } catch (error) {
    console.error("POST booked property error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
