import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
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
    const bpId = parseInt(id, 10);
    const db = await readDb();

    const bp = db.bookedProperties.find((o) => o.id === bpId);
    if (!bp) {
      return NextResponse.json(
        { success: false, message: "Booked property not found" },
        { status: 404 }
      );
    }

    const property = db.properties.find((p) => p.id === bp.propertyId);
    const buyer = db.users.find((u) => u.id === bp.userId);
    const agentUser = db.users.find((u) => u.agentId === bp.agentId);

    const data = {
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

    return NextResponse.json({
      success: true,
      message: "Booked property details retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET booked property detail error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const bpId = parseInt(id, 10);
    const body = await request.json();
    const { isPropAmountAccepted, isSold } = body as {
      isPropAmountAccepted?: boolean;
      isSold?: boolean;
    };

    const db = await readDb();
    const bp = db.bookedProperties.find((o) => o.id === bpId);

    if (!bp) {
      return NextResponse.json(
        { success: false, message: "Booked property not found" },
        { status: 404 }
      );
    }

    if (isPropAmountAccepted !== undefined) bp.isPropAmountAccepted = isPropAmountAccepted;
    if (isSold !== undefined) bp.isSold = isSold;
    bp.updatedAt = new Date().toISOString();

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Booked property status updated successfully",
      data: {
        id: bp.id,
        propertyId: bp.propertyId,
        userId: bp.userId,
        agentId: bp.agentId,
        proposedAmount: bp.proposedAmount,
        isPropAmountAccepted: bp.isPropAmountAccepted,
        isSold: bp.isSold,
        bookedAt: bp.bookedAt,
        updatedAt: bp.updatedAt,
      },
    });
  } catch (error) {
    console.error("PUT booked property error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
