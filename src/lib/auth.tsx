"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type Role = "super_admin" | "group_admin" | "staff";

export interface User {
  _id: string;
  loginId: string;
  name: string;
  role: Role;
  groupId?: string;
  groupName?: string;
  storeId?: string;
  storeName?: string;
}

export interface ViewAs {
  role: "group_admin" | "staff";
  groupId: string;
  groupName: string;
  storeId?: string;
  storeName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (loginId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isRealSuperAdmin: boolean;
  groupId: Id<"groups"> | null;
  viewAs: ViewAs | null;
  setViewAs: (va: ViewAs | null) => void;
}

const ADMIN_ONLY_PATHS = ["/inventory", "/matching", "/settings"];
const SUPER_ADMIN_ONLY_PATHS = ["/admin"];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewAs, setViewAs] = useState<ViewAs | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const convex = useConvex();

  useEffect(() => {
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (user && pathname === "/login") {
      router.replace("/dashboard");
      return;
    }

    if (user && user.role === "staff" && ADMIN_ONLY_PATHS.includes(pathname)) {
      router.replace("/dashboard");
      return;
    }

    if (user && user.role !== "super_admin" && SUPER_ADMIN_ONLY_PATHS.includes(pathname)) {
      router.replace("/dashboard");
    }
  }, [user, pathname, isLoaded, router]);

  async function login(loginId: string, password: string): Promise<boolean> {
    try {
      const result = await convex.mutation(api.auth.login, { loginId, password });
      if (!result) return false;

      const newUser: User = {
        _id: result._id,
        loginId: result.loginId,
        name: result.name,
        role: result.role,
        groupId: result.groupId ?? undefined,
        groupName: result.groupName ?? undefined,
        storeId: result.storeId ?? undefined,
        storeName: result.storeName ?? undefined,
      };
      setUser(newUser);
      localStorage.setItem("auth_user", JSON.stringify(newUser));
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    setUser(null);
    setViewAs(null);
    localStorage.removeItem("auth_user");
    router.replace("/login");
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const isRealSuperAdmin = user?.role === "super_admin";

  // viewAs가 설정되면 해당 역할로 전환
  const effectiveRole = viewAs?.role ?? user?.role;
  const isAdmin = effectiveRole === "super_admin" || effectiveRole === "group_admin";
  const isSuperAdmin = viewAs ? false : isRealSuperAdmin;
  const groupId = viewAs
    ? (viewAs.groupId as Id<"groups">)
    : (user?.groupId as Id<"groups">) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: viewAs
          ? { ...user!, groupId: viewAs.groupId, groupName: viewAs.groupName, storeId: viewAs.storeId, storeName: viewAs.storeName, role: viewAs.role }
          : user,
        login,
        logout,
        isAdmin: !!isAdmin,
        isSuperAdmin: !!isSuperAdmin,
        isRealSuperAdmin: !!isRealSuperAdmin,
        groupId,
        viewAs,
        setViewAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuth: AuthContextType = {
  user: null,
  login: async () => false,
  logout: () => {},
  isAdmin: false,
  isSuperAdmin: false,
  isRealSuperAdmin: false,
  groupId: null,
  viewAs: null,
  setViewAs: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context ?? defaultAuth;
}
