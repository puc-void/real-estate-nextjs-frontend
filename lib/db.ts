import fs from "fs/promises";
import path from "path";

// Define Data interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "USER" | "AGENT" | "ADMIN";
  isVerified: boolean;
  isFraud: boolean;
  imageUrl: string;
  agentId?: string; // Links user to their agent record ID
  contactNumber?: string;
  address?: string;
  generatedAt?: string;
  updatedAt?: string;
}

export interface Property {
  id: number;
  agentId: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  priceRange: string;
  propertyType: "HOUSE" | "APARTMENT" | "COMMERCIAL";
  isVerified: boolean;
  isAdvertised: boolean;
  isBought: boolean;
  generatedAt: string;
  updatedAt: string;
  bedrooms: number;
  bathrooms: number;
}

export interface Offer {
  id: number;
  propertyId: number;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  offerAmount: string; // e.g. "$1700" or simple number/string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BOUGHT";
  offeredAt: string;
}

export interface WishlistItem {
  id: number;
  userId: string;
  propertyId: number;
}

// NEW collections per spec
export interface BookedProperty {
  id: number;
  propertyId: number;
  userId: string;
  agentId: string;
  proposedAmount: string;
  isPropAmountAccepted: boolean;
  isSold: boolean;
  bookedAt: string;
  updatedAt: string;
}

export interface SoldProperty {
  id: number;
  bookedPropertyId: number;
  propertyId: number;
  userId: string;
  agentId: string;
  amount: string;
  soldAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  receiverId: string | null; // null for admin
  receiverRole: "ADMIN" | "AGENT" | "USER";
  generatedAt: string;
}

export interface Review {
  id: string;
  propertyId: number;
  userId: string;
  rating: number;
  description: string;
  generatedAt: string;
  updatedAt: string;
}

export interface Otp {
  id: string;
  userId: string;
  otp: string;
  expiresAt: string;
  generatedAt: string;
  updatedAt: string;
  email: string;
}

interface DatabaseSchema {
  users: User[];
  properties: Property[];
  offers: Offer[];
  wishlist: WishlistItem[];
  bookedProperties: BookedProperty[];
  soldProperties: SoldProperty[];
  notifications: Notification[];
  reviews: Review[];
  otps: Otp[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Helper to seed the initial database state
const getInitialData = (): DatabaseSchema => {
  const agentId = "508f7879-e762-4666-869f-539c017df80a";
  const agentUserId = "b6747d21-d5b8-48c9-babd-8487f58eb92f";

  const users: User[] = [
    {
      id: "admin-user-id",
      name: "Admin Nestora",
      email: "admin@nestora.com",
      password: "admin123", // Simplified for local testing
      role: "ADMIN",
      isVerified: true,
      isFraud: false,
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      contactNumber: "+8801511111111",
      address: "Dhaka, Bangladesh",
      generatedAt: "2026-03-25T15:00:00.000Z",
      updatedAt: "2026-03-25T15:00:00.000Z",
    },
    {
      id: agentUserId,
      name: "John Agent",
      email: "agent@nestora.com",
      password: "agent123",
      role: "AGENT",
      isVerified: true, // Default verified to make demonstration easy
      isFraud: false,
      imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
      agentId: agentId,
      contactNumber: "+8801812345678",
      address: "Khulna, Bangladesh",
      generatedAt: "2026-03-25T15:06:09.054Z",
      updatedAt: "2026-04-25T13:29:03.391Z",
    },
    {
      id: "regular-user-id",
      name: "Sarah Customer",
      email: "user@nestora.com",
      password: "user123",
      role: "USER",
      isVerified: false,
      isFraud: false,
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      contactNumber: "+8801512345679",
      address: "Chittagong, Bangladesh",
      generatedAt: "2026-04-28T07:40:26.564Z",
      updatedAt: "2026-04-28T07:40:26.564Z",
    },
  ];

  const properties: Property[] = [
    {
      id: 1,
      agentId: agentId,
      title: "Commercial Shop Space",
      description: "Street-facing commercial space suitable for retail or small office setup in GEC Circle, Chattogram.",
      imageUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800",
      location: "GEC Circle, Chattogram",
      priceRange: "$1500-$1900",
      propertyType: "COMMERCIAL",
      isVerified: true, // Seed verified properties so they show on main screen
      isAdvertised: true,
      isBought: false,
      generatedAt: "2026-03-25T15:27:11.923Z",
      updatedAt: "2026-03-25T15:27:11.923Z",
      bedrooms: 0,
      bathrooms: 1,
    },
    {
      id: 2,
      agentId: agentId,
      title: "Luxury Apartment in Gulshan",
      description: "Modern fully furnished apartment with rooftop access and 24/7 security in the heart of Gulshan.",
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      location: "Gulshan-2, Dhaka",
      priceRange: "$2000-$2500",
      propertyType: "APARTMENT",
      isVerified: true,
      isAdvertised: true,
      isBought: false,
      generatedAt: "2026-03-25T15:27:57.790Z",
      updatedAt: "2026-03-25T15:27:57.790Z",
      bedrooms: 3,
      bathrooms: 3,
    },
    {
      id: 3,
      agentId: agentId,
      title: "Family House with Garden",
      description: "Cozy family house with garden, parking, and easy highway access located in Purbachal, Dhaka.",
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      location: "Purbachal, Dhaka",
      priceRange: "$2000-$2500",
      propertyType: "HOUSE",
      isVerified: false, // Start unverified to show admin functionality
      isAdvertised: false,
      isBought: false,
      generatedAt: "2026-03-25T15:29:13.081Z",
      updatedAt: "2026-04-03T04:22:56.900Z",
      bedrooms: 4,
      bathrooms: 3,
    },
  ];

  const notifications: Notification[] = [
    {
      id: "9352da86-1bf8-4cc2-b3f2-0e6567fb0fb8",
      title: "New Agent Registered",
      message: "John Agent registered as agent in our app",
      receiverId: null,
      receiverRole: "ADMIN",
      generatedAt: "2026-05-07T06:31:41.814Z"
    }
  ];

  const reviews: Review[] = [
    {
      id: "9592bcc4-2ce9-42ef-9a69-5048cbf85eac",
      propertyId: 1,
      userId: "regular-user-id",
      rating: 5,
      description: "Excellent apartment, very clean and well maintained.",
      generatedAt: "2026-04-02T18:50:31.028Z",
      updatedAt: "2026-04-02T18:50:31.028Z"
    }
  ];

  return {
    users,
    properties,
    offers: [],
    wishlist: [],
    bookedProperties: [],
    soldProperties: [],
    notifications,
    reviews,
    otps: [],
  };
};

// Initialize database file
export async function initDb() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // DB file does not exist, seed it
      await fs.writeFile(DB_FILE, JSON.stringify(getInitialData(), null, 2), "utf8");
    }
  } catch (error) {
    console.error("Failed to initialize database", error);
  }
}

// Read database
export async function readDb(): Promise<DatabaseSchema> {
  await initDb();
  try {
    const data = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(data);
    
    // Ensure all tables exist (migration defense)
    if (!parsed.users) parsed.users = [];
    if (!parsed.properties) parsed.properties = [];
    if (!parsed.offers) parsed.offers = [];
    if (!parsed.wishlist) parsed.wishlist = [];
    if (!parsed.bookedProperties) parsed.bookedProperties = [];
    if (!parsed.soldProperties) parsed.soldProperties = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.reviews) parsed.reviews = [];
    if (!parsed.otps) parsed.otps = [];

    return parsed;
  } catch (error) {
    console.error("Failed to read database", error);
    return getInitialData();
  }
}

// Write database
export async function writeDb(data: DatabaseSchema): Promise<void> {
  await initDb();
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write database", error);
  }
}
