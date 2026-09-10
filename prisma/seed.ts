import { PrismaClient, SkillCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SKILLS: { name: string; category: SkillCategory }[] = [
  { name: "JavaScript", category: "TECHNICAL" },
  { name: "TypeScript", category: "TECHNICAL" },
  { name: "React", category: "TECHNICAL" },
  { name: "Next.js", category: "TECHNICAL" },
  { name: "Node.js", category: "TECHNICAL" },
  { name: "PostgreSQL", category: "TECHNICAL" },
  { name: "Python", category: "TECHNICAL" },
  { name: "REST APIs", category: "TECHNICAL" },
  { name: "Git", category: "TOOL" },
  { name: "Docker", category: "TOOL" },
  { name: "Figma", category: "TOOL" },
  { name: "Communication", category: "SOFT" },
  { name: "Teamwork", category: "SOFT" },
  { name: "Problem Solving", category: "SOFT" },
  { name: "Leadership", category: "SOFT" },
  { name: "English", category: "LANGUAGE" },
];

async function main() {
  console.log("Seeding database...");

  await prisma.skill.createMany({
    data: SKILLS,
    skipDuplicates: true,
  });
  const skills = await prisma.skill.findMany();
  const skillByName = new Map(skills.map((s) => [s.name, s]));

  const demoPasswordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@careercopilot.dev" },
    update: {},
    create: {
      email: "admin@careercopilot.dev",
      passwordHash: demoPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: "Ada Admin",
          location: "Remote",
          careerLevel: "SENIOR",
          currentJobTitle: "Platform Administrator",
          profileCompletion: 100,
        },
      },
      subscription: { create: { plan: "PRO", status: "ACTIVE" } },
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@careercopilot.dev" },
    update: {},
    create: {
      email: "demo@careercopilot.dev",
      passwordHash: demoPasswordHash,
      role: "USER",
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: "Demo Candidate",
          location: "Lagos, Nigeria",
          careerLevel: "MID",
          currentJobTitle: "Frontend Developer",
          desiredJobTitle: "Senior Frontend Developer",
          desiredIndustry: "Technology",
          yearsExperience: 3,
          preferredWorkArrangement: "REMOTE",
          preferredLocation: "Remote",
          salaryExpectationMin: 60000,
          salaryExpectationMax: 90000,
          professionalInterests: ["Web Development", "AI Products"],
          profileCompletion: 70,
          educations: {
            create: [
              {
                institution: "University of Lagos",
                degree: "B.Sc.",
                fieldOfStudy: "Computer Science",
                startDate: new Date("2018-09-01"),
                endDate: new Date("2022-07-01"),
              },
            ],
          },
          experiences: {
            create: [
              {
                company: "Acme Software",
                jobTitle: "Frontend Developer",
                location: "Remote",
                startDate: new Date("2022-09-01"),
                isCurrent: true,
                responsibilities: "Build and maintain React/Next.js applications.",
                achievements: "Reduced page load time by 35% through code-splitting.",
              },
            ],
          },
        },
      },
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });

  const demoSkillNames = ["JavaScript", "TypeScript", "React", "Git", "Communication"];
  for (const name of demoSkillNames) {
    const skill = skillByName.get(name);
    if (!skill) continue;
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: demoUser.id, skillId: skill.id } },
      update: {},
      create: { userId: demoUser.id, skillId: skill.id, level: "INTERMEDIATE" },
    });
  }

  const job1 = await prisma.job.upsert({
    where: { source_externalId: { source: "MANUAL", externalId: "seed-job-1" } },
    update: {},
    create: {
      source: "MANUAL",
      externalId: "seed-job-1",
      title: "Senior Frontend Developer",
      company: "Nimbus Cloud",
      location: "Remote",
      remoteType: "REMOTE",
      salaryMin: 70000,
      salaryMax: 100000,
      description:
        "We are looking for a Senior Frontend Developer to build our customer dashboard using React, TypeScript, and Next.js.",
      requirements: "5+ years experience, React, TypeScript, testing, REST APIs.",
      industry: "Technology",
      experienceLevel: "Senior",
      datePosted: new Date(),
    },
  });

  const job2 = await prisma.job.upsert({
    where: { source_externalId: { source: "MANUAL", externalId: "seed-job-2" } },
    update: {},
    create: {
      source: "MANUAL",
      externalId: "seed-job-2",
      title: "Full-Stack Engineer",
      company: "Harborlight",
      location: "Remote",
      remoteType: "REMOTE",
      salaryMin: 65000,
      salaryMax: 95000,
      description:
        "Full-stack role building features across a Next.js frontend and a Node.js/PostgreSQL backend.",
      requirements: "3+ years experience, Node.js, PostgreSQL, React.",
      industry: "Technology",
      experienceLevel: "Mid",
      datePosted: new Date(),
    },
  });

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const moreJobs = [
    {
      externalId: "seed-job-3",
      title: "Junior Backend Developer",
      company: "Data Systems Inc",
      location: "Lagos, Nigeria",
      remoteType: "ONSITE" as const,
      salaryMin: 20000,
      salaryMax: 35000,
      description:
        "Join our backend team building APIs for fintech products. Great for early-career developers.",
      requirements: "0-2 years experience, Node.js, PostgreSQL, Git.",
      industry: "Fintech",
      experienceLevel: "Entry",
      datePosted: daysAgo(10),
    },
    {
      externalId: "seed-job-4",
      title: "Product Designer",
      company: "Coral Studio",
      location: "Berlin, Germany",
      remoteType: "HYBRID" as const,
      salaryMin: 50000,
      salaryMax: 70000,
      description: "Design end-to-end product experiences for a design-led SaaS studio.",
      requirements: "3+ years experience, Figma, design systems, user research.",
      industry: "Design",
      experienceLevel: "Mid",
      datePosted: daysAgo(2),
    },
    {
      externalId: "seed-job-5",
      title: "DevOps Engineer",
      company: "CloudPeak",
      location: "Remote",
      remoteType: "REMOTE" as const,
      salaryMin: 90000,
      salaryMax: 130000,
      description: "Own our CI/CD pipelines and cloud infrastructure at scale.",
      requirements: "5+ years experience, Docker, Kubernetes, AWS, Terraform.",
      industry: "Technology",
      experienceLevel: "Senior",
      datePosted: daysAgo(20),
    },
    {
      externalId: "seed-job-6",
      title: "Data Analyst",
      company: "HealthFirst",
      location: "New York, USA",
      remoteType: "ONSITE" as const,
      salaryMin: 55000,
      salaryMax: 70000,
      description: "Analyze patient outcome data to support clinical decision-making.",
      requirements: "1-3 years experience, SQL, Python, data visualization.",
      industry: "Healthcare",
      experienceLevel: "Entry",
      datePosted: daysAgo(5),
    },
    {
      externalId: "seed-job-7",
      title: "Mobile Engineer (React Native)",
      company: "FinEdge",
      location: "Remote",
      remoteType: "REMOTE" as const,
      salaryMin: 75000,
      salaryMax: 105000,
      description: "Build our cross-platform mobile banking app used by millions.",
      requirements: "3+ years experience, React Native, TypeScript, REST APIs.",
      industry: "Finance",
      experienceLevel: "Mid",
      datePosted: daysAgo(1),
    },
    {
      externalId: "seed-job-8",
      title: "Marketing Manager",
      company: "BrightAds",
      location: "London, UK",
      remoteType: "HYBRID" as const,
      salaryMin: 60000,
      salaryMax: 85000,
      description: "Lead campaign strategy and growth marketing for a mid-size ad agency.",
      requirements: "5+ years experience, campaign management, analytics, leadership.",
      industry: "Marketing",
      experienceLevel: "Senior",
      datePosted: daysAgo(15),
    },
  ];

  for (const job of moreJobs) {
    await prisma.job.upsert({
      where: { source_externalId: { source: "MANUAL", externalId: job.externalId } },
      update: {},
      create: { source: "MANUAL", ...job },
    });
  }

  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: demoUser.id, jobId: job1.id } },
    update: {},
    create: { userId: demoUser.id, jobId: job1.id },
  });

  await prisma.application.create({
    data: {
      userId: demoUser.id,
      jobId: job2.id,
      companyName: job2.company,
      jobTitle: job2.title,
      status: "APPLIED",
      appliedDate: new Date(),
      jobLink: job2.url ?? undefined,
    },
  });

  const interview = await prisma.interview.create({
    data: {
      userId: demoUser.id,
      jobTitle: "Senior Frontend Developer",
      industry: "Technology",
      experienceLevel: "Senior",
      type: "BEHAVIORAL",
    },
  });

  await prisma.interviewSession.create({
    data: {
      userId: demoUser.id,
      interviewId: interview.id,
      mode: "PRACTICE",
      questions: [
        { question: "Tell me about a challenging project you worked on." },
        { question: "Describe a time you disagreed with a teammate. How did you resolve it?" },
      ],
    },
  });

  await prisma.careerGoal.create({
    data: {
      userId: demoUser.id,
      title: "Get promoted to Senior Frontend Developer",
      description: "Focus on system design and mentoring to move up a level.",
      term: "MEDIUM",
      targetDate: new Date("2026-12-31"),
      progress: 40,
      status: "IN_PROGRESS",
    },
  });

  console.log("Seed complete:", { admin: admin.email, demoUser: demoUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
