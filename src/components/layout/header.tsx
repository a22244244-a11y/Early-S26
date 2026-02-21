"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const allNavItems = [
  { href: "/dashboard", label: "대시보드", adminOnly: false, superOnly: false },
  { href: "/reservations", label: "예약 등록", adminOnly: false, superOnly: false },
  { href: "/inventory", label: "재고 관리", adminOnly: true, superOnly: false },
  { href: "/matching", label: "자동 매칭", adminOnly: true, superOnly: false },
  { href: "/admin", label: "시스템 관리", adminOnly: false, superOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();

  if (!user || pathname === "/login") return null;

  const navItems = allNavItems.filter((item) => {
    if (item.superOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const roleBadge = {
    super_admin: { label: "시스템관리자", variant: "destructive" as const },
    group_admin: { label: "관리자", variant: "default" as const },
    staff: { label: "직원", variant: "secondary" as const },
  }[user.role];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b bg-white sticky top-0 z-50"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            Galaxy S26 예약관리
          </span>
          {user.groupName && (
            <Badge variant="outline" className="text-xs">
              {user.groupName}
            </Badge>
          )}
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-2 border-l pl-4">
            <Badge variant={roleBadge.variant}>
              {roleBadge.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
