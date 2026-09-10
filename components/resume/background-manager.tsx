"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Certification, Education, Experience, Project } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface BackgroundManagerProps {
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
}

async function submitJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Something went wrong");
  }
  return res.json();
}

function fmtDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export function BackgroundManager({
  education,
  experience,
  projects,
  certifications,
}: BackgroundManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const handleError = (e: unknown) => {
    setError(e instanceof Error ? e.message : "Something went wrong");
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Education</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {education.map((edu) => (
              <li
                key={edu.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>
                  {[edu.degree, edu.fieldOfStudy, edu.institution].filter(Boolean).join(", ")}
                  {edu.startDate &&
                    ` · ${fmtDate(edu.startDate)} – ${fmtDate(edu.endDate) || "present"}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await submitJson(`/api/profile/education/${edu.id}`, "DELETE", {});
                      refresh();
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
            {education.length === 0 && (
              <p className="text-muted-foreground text-sm">No education added yet.</p>
            )}
          </ul>
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                await submitJson("/api/profile/education", "POST", {
                  institution: form.get("institution"),
                  degree: form.get("degree"),
                  fieldOfStudy: form.get("fieldOfStudy"),
                  startDate: form.get("startDate"),
                  endDate: form.get("endDate"),
                });
                (e.target as HTMLFormElement).reset();
                refresh();
              } catch (e) {
                handleError(e);
              }
            }}
          >
            <Input name="institution" placeholder="Institution" required className="col-span-2" />
            <Input name="degree" placeholder="Degree" />
            <Input name="fieldOfStudy" placeholder="Field of study" />
            <Input name="startDate" type="date" placeholder="Start date" />
            <Input name="endDate" type="date" placeholder="End date" />
            <Button type="submit" size="sm" className="col-span-2 justify-self-start">
              Add education
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work experience</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {experience.map((exp) => (
              <li
                key={exp.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>
                  {exp.jobTitle} at {exp.company}
                  {exp.startDate &&
                    ` · ${fmtDate(exp.startDate)} – ${exp.isCurrent ? "present" : fmtDate(exp.endDate)}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await submitJson(`/api/profile/experience/${exp.id}`, "DELETE", {});
                      refresh();
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
            {experience.length === 0 && (
              <p className="text-muted-foreground text-sm">No experience added yet.</p>
            )}
          </ul>
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                await submitJson("/api/profile/experience", "POST", {
                  company: form.get("company"),
                  jobTitle: form.get("jobTitle"),
                  location: form.get("location"),
                  startDate: form.get("startDate"),
                  endDate: form.get("endDate"),
                  isCurrent: form.get("isCurrent") === "on",
                  responsibilities: form.get("responsibilities"),
                  achievements: form.get("achievements"),
                });
                (e.target as HTMLFormElement).reset();
                refresh();
              } catch (e) {
                handleError(e);
              }
            }}
          >
            <Input name="jobTitle" placeholder="Job title" required />
            <Input name="company" placeholder="Company" required />
            <Input name="location" placeholder="Location" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isCurrent" /> Current role
            </label>
            <Input name="startDate" type="date" />
            <Input name="endDate" type="date" />
            <Textarea
              name="responsibilities"
              placeholder="Responsibilities"
              className="col-span-2"
            />
            <Textarea
              name="achievements"
              placeholder="Achievements (measurable, if possible)"
              className="col-span-2"
            />
            <Button type="submit" size="sm" className="col-span-2 justify-self-start">
              Add experience
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {projects.map((proj) => (
              <li
                key={proj.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>{proj.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await submitJson(`/api/profile/projects/${proj.id}`, "DELETE", {});
                      refresh();
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
            {projects.length === 0 && (
              <p className="text-muted-foreground text-sm">No projects added yet.</p>
            )}
          </ul>
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                await submitJson("/api/profile/projects", "POST", {
                  name: form.get("name"),
                  description: form.get("description"),
                  technologies: String(form.get("technologies") ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  url: form.get("url"),
                });
                (e.target as HTMLFormElement).reset();
                refresh();
              } catch (e) {
                handleError(e);
              }
            }}
          >
            <Input name="name" placeholder="Project name" required className="col-span-2" />
            <Textarea name="description" placeholder="Description" className="col-span-2" />
            <Input name="technologies" placeholder="Technologies (comma separated)" />
            <Input name="url" placeholder="Project URL" />
            <Button type="submit" size="sm" className="col-span-2 justify-self-start">
              Add project
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {certifications.map((cert) => (
              <li
                key={cert.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>{[cert.name, cert.issuer].filter(Boolean).join(", ")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await submitJson(`/api/profile/certifications/${cert.id}`, "DELETE", {});
                      refresh();
                    } catch (e) {
                      handleError(e);
                    }
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
            {certifications.length === 0 && (
              <p className="text-muted-foreground text-sm">No certifications added yet.</p>
            )}
          </ul>
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              try {
                await submitJson("/api/profile/certifications", "POST", {
                  name: form.get("name"),
                  issuer: form.get("issuer"),
                  issueDate: form.get("issueDate"),
                  expiryDate: form.get("expiryDate"),
                  credentialUrl: form.get("credentialUrl"),
                });
                (e.target as HTMLFormElement).reset();
                refresh();
              } catch (e) {
                handleError(e);
              }
            }}
          >
            <Input name="name" placeholder="Certification name" required className="col-span-2" />
            <Input name="issuer" placeholder="Issuer" />
            <Input name="credentialUrl" placeholder="Credential URL" />
            <Input name="issueDate" type="date" />
            <Input name="expiryDate" type="date" />
            <Button type="submit" size="sm" className="col-span-2 justify-self-start">
              Add certification
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
