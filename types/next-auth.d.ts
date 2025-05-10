import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
    };
    expiresAt?: number;
  }

  interface User extends DefaultUser {
    id: string;
    emailVerified: Date | null;
    password?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    createdAt?: number;
  }
}
