import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, SoldProperty } from "@/lib/db";
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

    const data = db.soldProperties.map((sp) => {
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
    console.error("GET sold properties error:", error);
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
    const { bookedPropertyId, propertyId, userId, agentId, amount } = body as {
      bookedPropertyId: number;
      propertyId: number;
      userId: string;
      agentId: string;
      amount: string;
    };

    if (!bookedPropertyId || !propertyId || !userId || !agentId || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing transaction details" },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Create the transaction record
    const newSale: SoldProperty = {
      id: db.soldProperties.length > 0 ? Math.max(...db.soldProperties.map((s) => s.id)) + 1 : 1,
      bookedPropertyId,
      propertyId,
      userId,
      agentId,
      amount,
      soldAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.soldProperties.push(newSale);

    // Update property as bought
    const prop = db.properties.find((p) => p.id === propertyId);
    if (prop) {
      prop.isBought = true;
      prop.updatedAt = new Date().toISOString();
    }

    // Update booking status as sold
    const booking = db.bookedProperties.find((bp) => bp.id === bookedPropertyId);
    if (booking) {
      booking.isSold = true;
      booking.updatedAt = new Date().toISOString();
    }

    // Create notifications for agent
    db.notifications.push({
      id: crypto.randomUUID(),
      title: "New Property Sold",
      message: "Check your property list",
      receiverId: agentId,
      receiverRole: "AGENT",
      generatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Sold property added successfully",
      data: newSale,
    }, { status: 201 });
  } catch (error) {
    console.error("POST sold property error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
