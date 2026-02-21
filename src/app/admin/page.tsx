"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupManagement } from "@/components/admin/group-management";
import { StoreManagement } from "@/components/admin/store-management";
import { UserManagement } from "@/components/admin/user-management";

export default function AdminPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">시스템 관리</h1>
        <Tabs defaultValue="groups">
          <TabsList>
            <TabsTrigger value="groups">그룹 관리</TabsTrigger>
            <TabsTrigger value="stores">매장 관리</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
          </TabsList>
          <TabsContent value="groups" className="mt-4">
            <GroupManagement />
          </TabsContent>
          <TabsContent value="stores" className="mt-4">
            <StoreManagement />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
