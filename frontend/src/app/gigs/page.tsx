"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/components/dashboard/Navigation";
import GigsPage from "@/components/gigs/GigsPage";

export default function GigsRoutePage() {
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
      <Navigation currentPage="gigs" onNavigate={handleNavigate} />
      <GigsPage />
    </div>
  );
}
