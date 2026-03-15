// utils/adminAuth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // <- import from your lib/auth.ts
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login"); // Not logged in
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/"); // Not an admin
  }

  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === "admin";
}