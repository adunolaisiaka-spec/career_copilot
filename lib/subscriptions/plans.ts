export const PLAN_LIMITS = {
  FREE: {
    maxApplications: 10,
    maxSavedJobs: 15,
    maxResumeAnalysesPerMonth: 3,
  },
  PRO: {
    maxApplications: Infinity,
    maxSavedJobs: Infinity,
    maxResumeAnalysesPerMonth: Infinity,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
export type LimitedResource = keyof (typeof PLAN_LIMITS)["FREE"];

export const PLAN_FEATURES: Record<Plan, string[]> = {
  FREE: [
    "Basic profile & resume builder",
    `Up to ${PLAN_LIMITS.FREE.maxApplications} tracked applications`,
    `Up to ${PLAN_LIMITS.FREE.maxSavedJobs} saved jobs`,
    `${PLAN_LIMITS.FREE.maxResumeAnalysesPerMonth} resume analyses / month`,
  ],
  PRO: [
    "Everything in Free",
    "Unlimited tracked applications",
    "Unlimited saved jobs",
    "Unlimited resume analyses",
    "Advanced interview preparation",
    "AI-generated career roadmap",
  ],
};
