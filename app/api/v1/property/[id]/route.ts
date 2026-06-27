import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const propertyUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().url("Must be a valid image URL"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  priceRange: z.string().min(3, "Price range must be at least 3 characters"),
  propertyType: z.enum(["HOUSE", "APARTMENT", "COMMERCIAL"]),
  bedrooms: z.number().int().nonnegative().default(0),
  bathrooms: z.number().int().nonnegative().default(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = parseInt(id, 10);
    const db = await readDb();

    const prop = db.properties.find((p) => p.id === propertyId);
    if (!prop) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    const agentUser = db.users.find((u) => u.agentId === prop.agentId);
    const propertyWithAgent = {
      ...prop,
      agent: agentUser
        ? {
            id: agentUser.agentId,
            userId: agentUser.id,
            isVerified: agentUser.isVerified,
            isFraud: agentUser.isFraud,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      message: "Property details retrieved successfully",
      data: propertyWithAgent,
    });
  } catch (error) {
    console.error("GET property details error:", error);
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
    const propertyId = parseInt(id, 10);
    const db = await readDb();
    const propIndex = db.properties.findIndex((p) => p.id === propertyId);

    if (propIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    const prop = db.properties[propIndex];

    // ADMIN updates (isVerified or isAdvertised)
    if (user.role === "ADMIN") {
      const body = await request.json();
      const { isVerified, isAdvertised } = body as { isVerified?: boolean; isAdvertised?: boolean };

      const updatedProperty = { ...prop };
      if (isVerified !== undefined) {
        updatedProperty.isVerified = isVerified;
      }
      if (isAdvertised !== undefined) {
        updatedProperty.isAdvertised = isAdvertised;
      }
      updatedProperty.updatedAt = new Date().toISOString();

      db.properties[propIndex] = updatedProperty;
      await writeDb(db);

      return NextResponse.json({
        success: true,
        message: "Property updated successfully by admin",
        data: updatedProperty,
      });
    }

    // AGENT updates
    if (user.role !== "AGENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Agents or admins only." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = propertyUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if property belongs to this agent
    if (prop.agentId !== user.agentId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You do not own this property." },
        { status: 403 }
      );
    }

    const updatedProperty = {
      ...prop,
      title: result.data.title,
      description: result.data.description,
      imageUrl: result.data.imageUrl,
      location: result.data.location,
      priceRange: result.data.priceRange,
      propertyType: result.data.propertyType,
      bedrooms: result.data.bedrooms,
      bathrooms: result.data.bathrooms,
      updatedAt: new Date().toISOString(),
    };

    db.properties[propIndex] = updatedProperty;
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    console.error("PUT property error:", error);
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
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const propertyId = parseInt(id, 10);
    const db = await readDb();

    const propIndex = db.properties.findIndex((p) => p.id === propertyId);
    if (propIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    const prop = db.properties[propIndex];

    // If Agent, check ownership
    if (user.role === "AGENT" && prop.agentId !== user.agentId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You do not own this property." },
        { status: 403 }
      );
    }

    // Delete property
    const deletedProp = db.properties.splice(propIndex, 1)[0];
    
    // Also remove from wishlist and delete associated offers
    db.wishlist = db.wishlist.filter((w) => w.propertyId !== propertyId);
    db.offers = db.offers.filter((o) => o.propertyId !== propertyId);

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
      data: deletedProp,
    });
  } catch (error) {
    console.error("DELETE property error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
