import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readDb, writeDb, Offer } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const offerSchema = z.object({
  propertyId: z.number(),
  buyerName: z.string().min(3, "Name must be at least 3 characters"),
  buyerEmail: z.string().email("Invalid email address"),
  offerAmount: z.string().min(1, "Offer amount is required"),
});

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
    let userOffers: Offer[] = [];

    if (user.role === "ADMIN") {
      userOffers = db.offers;
    } else if (user.role === "AGENT") {
      // Find properties owned by this agent
      const agentPropertiesIds = db.properties
        .filter((p) => p.agentId === user.agentId)
        .map((p) => p.id);
      
      userOffers = db.offers.filter((o) => agentPropertiesIds.includes(o.propertyId));
    } else {
      // Regular user gets their own offers
      userOffers = db.offers.filter((o) => o.userId === user.id);
    }

    // Join with property details
    const offersWithProperties = userOffers.map((offer) => {
      const prop = db.properties.find((p) => p.id === offer.propertyId);
      const agentUser = prop ? db.users.find((u) => u.agentId === prop.agentId) : null;
      
      return {
        ...offer,
        property: prop
          ? {
              ...prop,
              agent: agentUser
                ? {
                    id: agentUser.agentId,
                    userId: agentUser.id,
                    name: agentUser.name,
                    email: agentUser.email,
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: offersWithProperties,
    });
  } catch (error) {
    console.error("GET offers error:", error);
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
    const result = offerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { propertyId, buyerName, buyerEmail, offerAmount } = result.data;
    const db = await readDb();

    // Check if property exists
    const prop = db.properties.find((p) => p.id === propertyId);
    if (!prop) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    if (prop.isBought) {
      return NextResponse.json(
        { success: false, message: "This property is already sold/bought." },
        { status: 400 }
      );
    }

    const nextId = db.offers.length > 0 ? Math.max(...db.offers.map((o) => o.id)) + 1 : 1;
    const newOffer: Offer = {
      id: nextId,
      propertyId,
      userId: user.id,
      buyerName,
      buyerEmail,
      offerAmount,
      status: "PENDING",
      offeredAt: new Date().toISOString(),
    };

    db.offers.push(newOffer);
    await writeDb(db);

    return NextResponse.json(
      {
        success: true,
        message: "Offer submitted successfully",
        data: newOffer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST offer error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
