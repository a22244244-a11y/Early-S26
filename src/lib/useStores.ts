"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./auth";
import { Id } from "../../convex/_generated/dataModel";

export function useGroupStores() {
  const { groupId } = useAuth();
  const stores = useQuery(
    api.admin.storesByGroup,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  return stores ?? [];
}
