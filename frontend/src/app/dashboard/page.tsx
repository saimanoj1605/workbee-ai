"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/components/dashboard/Navigation";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

export default function DashboardPage() {
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
      <Navigation currentPage="dashboard" onNavigate={handleNavigate} />
      <StudentDashboard />
    </div>
  );
}
