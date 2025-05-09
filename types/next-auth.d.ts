import "next-auth";

declare module "next-auth" {
  interface Session {
    expiresAt?: number;
    user: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
    };
  }

  interface JWT {
    id?: string;
    createdAt?: number;
  }
}
