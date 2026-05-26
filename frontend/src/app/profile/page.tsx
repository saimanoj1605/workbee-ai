"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/components/dashboard/Navigation";
import ProfilePage from "@/components/dashboard/ProfilePage";

export default function ProfileRoutePage() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    if (page === "home") {
      router.push("/");
      return;
    }

    router.push(`/${page}`);
  };

  return (
    <div className="bg-background text-foreground">
      <Navigation currentPage="profile" onNavigate={handleNavigate} />
      <ProfilePage />
    </div>
  );
}
