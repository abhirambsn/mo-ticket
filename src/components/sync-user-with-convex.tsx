"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";

const SyncUserWithConvex = () => {
  const { user } = useUser();
  const updateUser = useMutation(api.users.updateUser);

  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      try {
        await updateUser({
          userId: user.id,
          firstName: user.firstName ? user.firstName.trim() : "",
          lastName: user.lastName ? user.lastName.trim() : "",
          email: user.emailAddresses[0].emailAddress ?? "",
        });
      } catch (err) {
        console.error(`[ERROR] Failed to sync user with Convex: ${err}`);
      }
    };

    syncUser();
  }, [user, updateUser]);
  return null;
};

export default SyncUserWithConvex;
