import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, User, Otp } from "@/lib/db";
import { signJwt } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, image, contactNumber, address, role } = body as {
      name: string;
      email: string;
      password?: string;
      image?: string;
      contactNumber?: string;
      address?: string;
      role: "USER" | "AGENT";
    };

    if (!name || name.length < 3) {
      return NextResponse.json(
        { success: false, message: "Name must be at least 3 characters" },
        { status: 400 }
      );
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (!role || !["USER", "AGENT"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role field" },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Check if email already exists
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const agentId = role === "AGENT" ? crypto.randomUUID() : undefined;

    const newUser: User = {
      id: userId,
      name,
      email,
      password,
      role,
      isVerified: false, // Verify OTP makes emailVerified true/verified.
      isFraud: false,
      imageUrl: image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      agentId,
      contactNumber: contactNumber || "",
      address: address || "",
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Create OTP
    const mockOtp: Otp = {
      id: crypto.randomUUID(),
      userId: userId,
      otp: "123456", // Default static OTP for easy testing
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      email: email,
    };
    db.otps.push(mockOtp);

    // Create a new notification for admin
    db.notifications.push({
      id: crypto.randomUUID(),
      title: role === "AGENT" ? "New Agent Registered" : "New User Registered",
      message: `${name} is new registered as ${role.toLowerCase()} in our app`,
      receiverId: null,
      receiverRole: "ADMIN",
      generatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    // Sign Token
    const token = await signJwt({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      agentId: newUser.agentId,
    });

    return NextResponse.json({
      success: true,
      message: "User generated successfully",
      token: token,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        emailVerified: false,
        image: newUser.imageUrl,
        role: newUser.role,
        status: "active",
        contactNumber: newUser.contactNumber,
        address: newUser.address,
        generatedAt: newUser.generatedAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
