"use client";

import { AuthProvider } from "@/lib/auth";
import { ReactNode } from "react";

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
