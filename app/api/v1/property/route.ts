import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readDb, writeDb, Property } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const propertyCreateSchema = z.object({
  agentId: z.string().uuid("Agent ID must be a valid UUID"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().url("Must be a valid image URL"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  priceRange: z.string().min(3, "Price range must be at least 3 characters"),
  propertyType: z.enum(["HOUSE", "APARTMENT", "COMMERCIAL"]),
  bedrooms: z.number().int().nonnegative().default(0),
  bathrooms: z.number().int().nonnegative().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const db = await readDb();

    // Map properties to include agent sub-object
    const propertiesWithAgent = db.properties.map((prop) => {
      const agentUser = db.users.find((u) => u.agentId === prop.agentId);
      return {
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
    });

    return NextResponse.json({
      success: true,
      message: "Properties retrieved successfully",
      data: propertiesWithAgent,
    });
  } catch (error) {
    console.error("GET properties error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "AGENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Agents only." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = propertyCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Verify agent matches
    if (user.agentId !== result.data.agentId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Agent ID mismatch." },
        { status: 403 }
      );
    }

    const nextId = db.properties.length > 0 ? Math.max(...db.properties.map((p) => p.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newProperty: Property = {
      id: nextId,
      agentId: result.data.agentId,
      title: result.data.title,
      description: result.data.description,
      imageUrl: result.data.imageUrl,
      location: result.data.location,
      priceRange: result.data.priceRange,
      propertyType: result.data.propertyType,
      isVerified: false,
      isAdvertised: false,
      isBought: false,
      generatedAt: now,
      updatedAt: now,
      bedrooms: result.data.bedrooms,
      bathrooms: result.data.bathrooms,
    };

    db.properties.push(newProperty);
    await writeDb(db);

    return NextResponse.json(
      {
        success: true,
        message: "Property added successfully",
        data: newProperty,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST property error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
