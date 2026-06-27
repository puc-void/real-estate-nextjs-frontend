import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

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
    const offerId = parseInt(id, 10);
    const body = await request.json();
    const { status } = body as { status: "ACCEPTED" | "REJECTED" | "BOUGHT" };

    if (!["ACCEPTED", "REJECTED", "BOUGHT"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid offer status" },
        { status: 400 }
      );
    }

    const db = await readDb();
    const offerIndex = db.offers.findIndex((o) => o.id === offerId);
    if (offerIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Offer not found" },
        { status: 404 }
      );
    }

    const offer = db.offers[offerIndex];
    const prop = db.properties.find((p) => p.id === offer.propertyId);

    if (!prop) {
      return NextResponse.json(
        { success: false, message: "Property associated with offer not found" },
        { status: 404 }
      );
    }

    // Auth Check
    if (status === "ACCEPTED" || status === "REJECTED") {
      // Only the agent listing this property can accept/reject
      if (user.role !== "AGENT" || prop.agentId !== user.agentId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized. Only the listing agent can accept/reject offers." },
          { status: 403 }
        );
      }
    } else if (status === "BOUGHT") {
      // Either the buyer (user) can complete payment, or the agent can mark it as bought
      const isBuyer = user.id === offer.userId;
      const isAgent = user.role === "AGENT" && prop.agentId === user.agentId;

      if (!isBuyer && !isAgent) {
        return NextResponse.json(
          { success: false, message: "Unauthorized to mark this offer as bought." },
          { status: 403 }
        );
      }

      if (offer.status !== "ACCEPTED" && isBuyer) {
        return NextResponse.json(
          { success: false, message: "Offer must be accepted first before buying." },
          { status: 400 }
        );
      }
    }

    // Update status
    offer.status = status;

    if (status === "BOUGHT") {
      // Mark property as bought
      prop.isBought = true;
      prop.updatedAt = new Date().toISOString();

      // Reject all other pending offers on this property
      db.offers = db.offers.map((o) => {
        if (o.propertyId === offer.propertyId && o.id !== offer.id && o.status === "PENDING") {
          return { ...o, status: "REJECTED" as const };
        }
        return o;
      });
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `Offer status updated to ${status} successfully`,
      data: offer,
    });
  } catch (error) {
    console.error("PUT offer status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
