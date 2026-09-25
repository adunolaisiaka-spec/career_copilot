import { getProfileForUser } from "@/server/services/profile.service";
import { listResumes } from "@/server/services/resume.service";
import { listApplications, getApplicationStats } from "@/server/services/application.service";
import { listGoals } from "@/server/services/goal.service";
import { listNotifications } from "@/server/services/notification.service";
import { listSessions } from "@/server/services/interview.service";

export interface ReadinessBreakdown {
  label: string;
  value: number;
  hint: string;
}

export interface NextBestMove {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  href: string;
  cta: string;
}

/**
 * Aggregates existing per-feature service data into one dashboard snapshot.
 * No new data is invented — every number here comes from a real row the
 * user already created (profile fields, a real resume analysis score,
 * real applications/interviews/goals). Career Readiness is a transparent
 * equal-weighted average of four real signals, not a fabricated metric.
 */
export async function getDashboardSnapshot(userId: string) {
  const [{ profile, skills }, resumes, applications, stats, goals, notifications, interviewSessions] =
    await Promise.all([
      getProfileForUser(userId),
      listResumes(userId),
      listApplications(userId),
      getApplicationStats(userId),
      listGoals(userId),
      listNotifications(userId),
      listSessions(userId),
    ]);

  const profileCompletion = profile?.profileCompletion ?? 0;

  const bestResumeScore = resumes.reduce((best, resume) => {
    const latest = resume.analyses[0]?.overallScore;
    return latest !== undefined && latest > best ? latest : best;
  }, 0);

  // Real-activity signal, same pattern as applicationActivity below: count of
  // completed practice/mock sessions, capped — not a quality score.
  const evaluatedSessions = interviewSessions.filter((s) => s.overallScore !== null).length;
  const interviewPracticeActivity = Math.min(100, evaluatedSessions * 25);

  const now = new Date();
  const upcomingInterviews = applications
    .flatMap((app) =>
      app.interviews
        .filter((iv) => iv.scheduledDate && iv.scheduledDate >= now)
        .map((iv) => ({
          id: iv.id,
          type: iv.type,
          scheduledDate: iv.scheduledDate!,
          jobTitle: app.jobTitle,
          companyName: app.companyName,
          applicationId: app.id,
        })),
    )
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
    .slice(0, 3);

  // Applications total, capped at 100, as a simple real-activity signal —
  // not a quality score, just "have they started applying."
  const applicationActivity = Math.min(100, stats.total * 10);

  const readiness: ReadinessBreakdown[] = [
    {
      label: "Profile",
      value: profileCompletion,
      hint: profileCompletion < 100 ? "Finish your profile for a stronger match." : "Complete.",
    },
    {
      label: "Resume",
      value: bestResumeScore,
      hint: resumes.length === 0 ? "Upload a resume to get scored." : "From your latest analysis.",
    },
    {
      label: "Applications",
      value: applicationActivity,
      hint: stats.total === 0 ? "Track your first application." : `${stats.total} tracked so far.`,
    },
    {
      label: "Interview practice",
      value: interviewPracticeActivity,
      hint:
        evaluatedSessions === 0
          ? "Run a mock session to sharpen this."
          : `${evaluatedSessions} session${evaluatedSessions > 1 ? "s" : ""} completed.`,
    },
  ];

  const readinessScore = Math.round(
    readiness.reduce((sum, r) => sum + r.value, 0) / readiness.length,
  );

  const activeGoals = goals
    .filter((g) => g.status !== "COMPLETED" && g.status !== "ABANDONED")
    .slice(0, 3);

  const staleApplicationDays = 7;
  const staleCutoff = new Date(Date.now() - staleApplicationDays * 24 * 60 * 60 * 1000);
  const staleApplications = applications.filter(
    (app) => app.status === "APPLIED" && app.updatedAt < staleCutoff,
  ).length;

  const nextBestMoves = buildNextBestMoves({
    profileCompletion,
    hasResume: resumes.length > 0,
    hasSkills: skills.length > 0,
    applicationTotal: stats.total,
    staleApplications,
    upcomingInterviewCount: upcomingInterviews.length,
    activeGoalCount: activeGoals.length,
  });

  return {
    profile,
    readiness,
    readinessScore,
    stats,
    upcomingInterviews,
    activeGoals,
    recentNotifications: notifications.slice(0, 5),
    nextBestMoves,
  };
}

function buildNextBestMoves(input: {
  profileCompletion: number;
  hasResume: boolean;
  hasSkills: boolean;
  applicationTotal: number;
  staleApplications: number;
  upcomingInterviewCount: number;
  activeGoalCount: number;
}): NextBestMove[] {
  const moves: NextBestMove[] = [];

  if (input.profileCompletion < 100) {
    moves.push({
      priority: input.profileCompletion < 50 ? "high" : "medium",
      title: "Complete your profile",
      description: `Your profile is ${input.profileCompletion}% complete — a fuller profile means sharper job matches and cover letters.`,
      href: "/profile",
      cta: "Edit profile",
    });
  }

  if (!input.hasResume) {
    moves.push({
      priority: "high",
      title: "Add your resume",
      description: "Upload a resume to get an AI-scored analysis and unlock job matching.",
      href: "/resume",
      cta: "Add resume",
    });
  }

  if (!input.hasSkills) {
    moves.push({
      priority: "medium",
      title: "Add your skills",
      description: "Skills power job matching and cover-letter generation — yours are empty.",
      href: "/profile",
      cta: "Add skills",
    });
  }

  if (input.applicationTotal === 0) {
    moves.push({
      priority: "medium",
      title: "Track your first application",
      description: "Your pipeline starts here — search jobs or log one you've already applied to.",
      href: "/jobs",
      cta: "Find jobs",
    });
  } else if (input.staleApplications > 0) {
    moves.push({
      priority: "medium",
      title: "Follow up on your applications",
      description: `${input.staleApplications} application${input.staleApplications > 1 ? "s haven't" : " hasn't"} moved in over a week — a quick follow-up can restart the conversation.`,
      href: "/applications",
      cta: "Review applications",
    });
  }

  if (input.upcomingInterviewCount > 0) {
    moves.push({
      priority: "high",
      title: "Prepare for your upcoming interview",
      description: "Run a mock interview session to walk in ready.",
      href: "/interviews",
      cta: "Practice now",
    });
  }

  if (input.activeGoalCount === 0) {
    moves.push({
      priority: "low",
      title: "Set a career goal",
      description: "Give your job search direction with a short, medium, or long-term goal.",
      href: "/career/goals",
      cta: "Set a goal",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return moves.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 4);
}
