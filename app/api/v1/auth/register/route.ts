import { NextResponse } from "next/server";
import { z } from "zod";
import { readDb, writeDb } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "AGENT", "ADMIN"]),
  imageUrl: z.string().url("Must be a valid profile image URL").optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role, imageUrl } = result.data;
    const db = await readDb();

    // Check if email already exists
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const isAgent = role === "AGENT";
    const agentId = isAgent ? crypto.randomUUID() : undefined;

    const newUser = {
      id: userId,
      name,
      email,
      password, // In-memory simple storage. In production, bcrypt is used.
      role,
      isVerified: role === "ADMIN", // Admin is pre-verified. Agents/Users start unverified.
      isFraud: false,
      imageUrl: imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      agentId,
    };

    db.users.push(newUser);
    await writeDb(db);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. You can now log in.",
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isVerified: newUser.isVerified,
          agentId: newUser.agentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
