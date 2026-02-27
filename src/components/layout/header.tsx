"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

const allNavItems = [
  { href: "/dashboard", label: "대시보드", adminOnly: false, superOnly: false },
  { href: "/reservations", label: "예약 등록", adminOnly: false, superOnly: false },
  { href: "/inventory", label: "재고 관리", adminOnly: true, superOnly: false },
  { href: "/matching", label: "자동 매칭", adminOnly: true, superOnly: false },
  { href: "/settings", label: "설정", adminOnly: true, superOnly: false },
  { href: "/admin", label: "시스템 관리", adminOnly: false, superOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin, isRealSuperAdmin, viewAs, setViewAs } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const groups = useQuery(
    api.admin.listGroups,
    isRealSuperAdmin ? {} : "skip"
  );
  const stores = useQuery(
    api.admin.listStores,
    isRealSuperAdmin ? {} : "skip"
  );

  if (!user || pathname === "/login") return null;

  const navItems = allNavItems.filter((item) => {
    if (item.superOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const roleBadge = viewAs
    ? { label: viewAs.role === "group_admin" ? "관리자" : "직원", variant: "default" as const }
    : {
        super_admin: { label: "시스템관리자", variant: "destructive" as const },
        group_admin: { label: "관리자", variant: "default" as const },
        staff: { label: "직원", variant: "secondary" as const },
      }[user.role];

  return (
    <>
      {/* 화면 전환 배너 */}
      {viewAs && (
        <div className="bg-amber-400 text-amber-900 text-center py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-[60]">
          <span>
            {viewAs.groupName}
            {viewAs.storeName && ` > ${viewAs.storeName}`}
            {viewAs.role === "group_admin" ? " (관리자)" : " (직원)"}
            {" "}화면 보기 중
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs bg-white/80 hover:bg-white"
            onClick={() => setViewAs(null)}
          >
            돌아가기
          </Button>
        </div>
      )}

      <header className="border-b bg-white sticky top-0 z-50" style={viewAs ? { top: 0, position: "sticky" } : undefined}>
        {/* 상단: 로고 + 유저 정보 */}
        <div className="container mx-auto flex h-12 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold tracking-tight">
              S26 예약관리
            </span>
            {user.groupName && (
              <Badge variant="outline" className="text-xs shrink-0">
                {user.groupName}
              </Badge>
            )}
          </Link>

          <div className="flex items-center gap-2">
            {isRealSuperAdmin ? (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="cursor-pointer">
                    <Badge variant={roleBadge.variant} className="cursor-pointer hover:opacity-80">
                      {roleBadge.label} ▾
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 max-h-[70vh] overflow-y-auto" align="end">
                  <div className="space-y-1">
                    {/* 원래 관리자 보기 */}
                    <button
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        !viewAs ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => {
                        setViewAs(null);
                        setPopoverOpen(false);
                      }}
                    >
                      시스템관리자 (원래 화면)
                    </button>

                    <div className="border-t my-1" />
                    <p className="px-3 py-1 text-xs text-muted-foreground font-medium">그룹 관리자로 보기</p>

                    {groups?.map((group) => {
                      const groupStores = stores?.filter(s => s.groupId === group._id) ?? [];
                      const isSelected = viewAs?.groupId === group._id && viewAs?.role === "group_admin";
                      return (
                        <div key={group._id}>
                          <button
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                              isSelected ? "bg-blue-100 text-blue-900 font-medium" : "hover:bg-muted"
                            )}
                            onClick={() => {
                              setViewAs({
                                role: "group_admin",
                                groupId: group._id,
                                groupName: group.name,
                              });
                              setPopoverOpen(false);
                            }}
                          >
                            {group.name}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({groupStores.length}매장)
                            </span>
                          </button>

                          {/* 매장(직원) 보기 */}
                          {groupStores.length > 0 && (
                            <div className="ml-4 space-y-0.5">
                              {groupStores.map((store) => {
                                const isStoreSelected = viewAs?.storeId === store._id && viewAs?.role === "staff";
                                return (
                                  <button
                                    key={store._id}
                                    className={cn(
                                      "w-full text-left px-2 py-1 rounded text-xs transition-colors",
                                      isStoreSelected ? "bg-green-100 text-green-900 font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                    onClick={() => {
                                      setViewAs({
                                        role: "staff",
                                        groupId: group._id,
                                        groupName: group.name,
                                        storeId: store._id,
                                        storeName: store.name,
                                      });
                                      setPopoverOpen(false);
                                    }}
                                  >
                                    ↳ {store.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
            )}
            <span className="hidden sm:inline text-sm text-muted-foreground">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              로그아웃
            </Button>
          </div>
        </div>

        {/* 하단: 네비게이션 탭 (가로 스크롤) */}
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 -mb-px scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
