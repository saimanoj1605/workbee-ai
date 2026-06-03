import prisma from "../config/db";
import { AppError } from "../utils/AppError";

const buildLastSevenDays = () => {
  const today = new Date();
  const days: string[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
};

export const getDashboard = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: {
          reputation: true,
          applications: {
            orderBy: { submittedAt: "desc" },
            include: {
              gig: {
                select: {
                  title: true,
                  location: true,
                  salaryRange: true,
                  business: {
                    select: { businessName: true },
                  },
                },
              },
            },
            take: 5,
          },
        },
      },
      business: {
        include: {
          gigs: {
            orderBy: { createdAt: "desc" },
            include: {
              _count: { select: { applications: true } },
            },
            take: 5,
          },
        },
      },
      reputation: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const openGigs = await prisma.gig.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      business: { select: { businessName: true } },
    },
    take: 4,
  });

  if (user.role === "STUDENT") {
    const student = user.student;
    if (!student) {
      throw new AppError("Student profile not found", 404);
    }

    const activitySince = new Date();
    activitySince.setDate(activitySince.getDate() - 6);

    const recentApplications = await prisma.application.findMany({
      where: {
        studentId: student.id,
        submittedAt: { gte: activitySince },
      },
      orderBy: { submittedAt: "asc" },
    });

    const activityByDay = buildLastSevenDays().map((day) => ({
      name: day.slice(5),
      applications: recentApplications.filter((app) =>
        app.submittedAt.toISOString().startsWith(day)
      ).length,
    }));

    const recommendedJobs = openGigs.map((gig) => {
      const skills = student.skills ?? [];
      const match = Math.min(
        100,
        Math.floor(
          40 +
            skills.filter((skill) => gig.skills.includes(skill)).length * 20
        )
      );

      return {
        id: gig.id,
        title: gig.title,
        company: gig.business.businessName,
        location: gig.location,
        match,
        type: gig.status,
        posted: gig.createdAt.toISOString().slice(0, 10),
      };
    });

    const completedJobs = student.applications.filter(
      (application) => application.status === "HIRED"
    ).length;

    const activeApplications = student.applications.filter(
      (application) =>
        application.status !== "REJECTED" && application.status !== "CANCELLED"
    ).length;

    const earnings = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        application: {
          studentId: student.id,
        },
        status: {
          in: ["RELEASED", "COMPLETED"],
        },
      },
    });

    return {
      fullName: user.fullName,
      role: user.role,
      quickStats: [
        {
          label: "Active Applications",
          value: String(activeApplications),
          change: `${student.applications.length} total`,
          color: "bg-slate-900/5",
        },
        {
          label: "Completed Jobs",
          value: String(completedJobs),
          change: "Based on hired applications",
          color: "bg-emerald-900/5",
        },
        {
          label: "Score",
          value: String(user.reputation?.score ?? 0),
          change: "Reputation level",
          color: "bg-blue-900/5",
        },
        {
          label: "Total Earned",
          value: `$${((earnings._sum.amount ?? 0) / 100).toFixed(2)}`,
          change: "Released payments",
          color: "bg-violet-900/5",
        },
      ],
      analyticsData: activityByDay,
      upcomingGigs: student.applications.slice(0, 3).map((application) => ({
        title: application.gig?.title ?? "Unknown role",
        client: application.gig?.business.businessName ?? "Unknown",
        date: application.submittedAt.toISOString().slice(0, 10),
        time: application.submittedAt.toISOString().slice(11, 16),
        payment: application.gig?.salaryRange ?? "N/A",
        status: application.status,
      })),
      recommendedJobs,
    };
  }

  const gigs = user.business?.gigs ?? [];
  return {
    fullName: user.fullName,
    role: user.role,
    quickStats: [
      {
        label: "Posted Gigs",
        value: String(gigs.length),
        change: `${gigs.filter((gig) => gig.status === "OPEN").length} open`,
        color: "bg-slate-900/5",
      },
      {
        label: "Total Applications",
        value: String(
          gigs.reduce((sum, gig) => sum + (gig._count.applications ?? 0), 0)
        ),
        change: "Across your posted gigs",
        color: "bg-emerald-900/5",
      },
      {
        label: "Open Gigs",
        value: String(gigs.filter((gig) => gig.status === "OPEN").length),
        change: "Live on marketplace",
        color: "bg-blue-900/5",
      },
      {
        label: "Reputation",
        value: String(user.reputation?.score ?? 0),
        change: "Company standing",
        color: "bg-violet-900/5",
      },
    ],
    analyticsData: buildLastSevenDays().map((day) => ({
      name: day.slice(5),
      applications: gigs.filter((gig) =>
        gig.createdAt.toISOString().startsWith(day)
      ).length,
    })),
    upcomingGigs: gigs.slice(0, 3).map((gig) => ({
      title: gig.title,
      client: user.business?.businessName ?? "Your Business",
      date: gig.createdAt.toISOString().slice(0, 10),
      time: gig.createdAt.toISOString().slice(11, 16),
      payment: gig.salaryRange ?? "N/A",
      status: gig.status,
    })),
    recommendedJobs: gigs.map((gig) => ({
      id: gig.id,
      title: gig.title,
      company: user.business?.businessName ?? "Your Business",
      location: gig.location,
      match: gig.status === "OPEN" ? 90 : 70,
      type: gig.status,
      posted: gig.createdAt.toISOString().slice(0, 10),
    })),
  };
};
