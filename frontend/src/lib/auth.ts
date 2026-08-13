import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            headers: { "Content-Type": "application/json" }
          });
          
          if (!res.ok) return null;
          
          const data = await res.json();
          if (data.access_token) {
            // Fetch user profile from backend
            const profileRes = await fetch(`${API_URL}/auth/me`, {
              headers: { "Authorization": `Bearer ${data.access_token}` }
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              return {
                id: profile.id.toString(),
                email: profile.email,
                name: profile.email,
                backendToken: data.access_token
              };
            }
          }
          return null;
        } catch (e) {
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        try {
          const res = await fetch(`${API_URL}/auth/guest`, {
            method: 'POST',
          });
          
          if (!res.ok) return null;
          
          const data = await res.json();
          if (data.access_token) {
            // Fetch user profile
            const profileRes = await fetch(`${API_URL}/auth/me`, {
              headers: { "Authorization": `Bearer ${data.access_token}` }
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              return {
                id: profile.id.toString(),
                email: profile.email,
                name: "Guest",
                backendToken: data.access_token
              };
            }
          }
          return null;
        } catch (e) {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_URL}/auth/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              google_id: account.providerAccountId,
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            // Attach token to the user object temporarily so jwt callback can access it
            (user as any).backendToken = data.access_token;
            return true;
          }
        } catch (e) {
          console.error("Error syncing Google user", e);
        }
        return false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Initial sign in
        if ((user as any).backendToken) {
          token.backendToken = (user as any).backendToken;
        }
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session as any).backendToken = token.backendToken;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  }
};
