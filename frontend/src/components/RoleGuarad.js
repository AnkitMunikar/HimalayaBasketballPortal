'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoleGuard({ role, userRole, children }) {
  const router = useRouter();

  useEffect(() => {
    if (!userRole || userRole !== role) {
      router.push("/login"); // redirect if role doesn't match
    }
  }, [role, userRole]);

  return <>{children}</>;
}
