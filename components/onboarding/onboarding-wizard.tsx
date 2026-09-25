"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Skill } from "@prisma/client";
import {
  onboardingSchema,
  type OnboardingFormInput,
  type OnboardingInput,
} from "@/lib/validation/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CAREER_LEVELS: { value: OnboardingInput["careerLevel"]; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "ENTRY", label: "Entry level" },
  { value: "MID", label: "Mid level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
  { value: "EXECUTIVE", label: "Executive" },
];

const WORK_ARRANGEMENTS: { value: OnboardingInput["preferredWorkArrangement"]; label: string }[] = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

const STEPS = ["Basics", "Career goals", "Education", "Skills"] as const;

const STEP_FIELDS: (keyof OnboardingFormInput)[][] = [
  ["fullName", "location", "careerLevel", "yearsExperience", "currentJobTitle"],
  [
    "desiredJobTitle",
    "desiredIndustry",
    "preferredWorkArrangement",
    "preferredLocation",
    "salaryExpectationMin",
    "salaryExpectationMax",
  ],
  [],
  [],
];

interface OnboardingWizardProps {
  skillCatalog: Skill[];
  initialValues: {
    fullName: string;
    selectedSkillNames: string[];
  };
}

export function OnboardingWizard({ skillCatalog, initialValues }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interestsText, setInterestsText] = useState("");
  const [customSkillsText, setCustomSkillsText] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormInput, unknown, OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: initialValues.fullName,
      professionalInterests: [],
      skillNames: initialValues.selectedSkillNames,
      yearsExperience: 0,
    },
  });

  const selectedSkillNames = watch("skillNames") ?? [];

  const toggleSkill = (name: string, checked: boolean) => {
    const current = new Set(selectedSkillNames);
    if (checked) current.add(name);
    else current.delete(name);
    setValue("skillNames", [...current], { shouldValidate: true });
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values: OnboardingInput) => {
    setServerError(null);

    const interests = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const customSkills = customSkillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: OnboardingInput = {
      ...values,
      professionalInterests: interests,
      skillNames: [...new Set([...values.skillNames, ...customSkills])],
    };

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const skillsByCategory = skillCatalog.reduce<Record<string, Skill[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </CardTitle>
        <CardDescription>
          Tell us about yourself so Career Copilot can personalize your experience.
        </CardDescription>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2" />
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-destructive text-sm">{errors.fullName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, Country" {...register("location")} />
                {errors.location && (
                  <p className="text-destructive text-sm">{errors.location.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="careerLevel">Career level</Label>
                <Controller
                  control={control}
                  name="careerLevel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="careerLevel" className="w-full">
                        <SelectValue placeholder="Select your career level">
                          {(value: string) => CAREER_LEVELS.find((opt) => opt.value === value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CAREER_LEVELS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.careerLevel && (
                  <p className="text-destructive text-sm">{errors.careerLevel.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="yearsExperience">Years of experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min={0}
                  {...register("yearsExperience")}
                />
                {errors.yearsExperience && (
                  <p className="text-destructive text-sm">{errors.yearsExperience.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentJobTitle">Current job title (optional)</Label>
                <Input id="currentJobTitle" {...register("currentJobTitle")} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desiredJobTitle">Desired job title</Label>
                <Input id="desiredJobTitle" {...register("desiredJobTitle")} />
                {errors.desiredJobTitle && (
                  <p className="text-destructive text-sm">{errors.desiredJobTitle.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desiredIndustry">Desired industry</Label>
                <Input id="desiredIndustry" {...register("desiredIndustry")} />
                {errors.desiredIndustry && (
                  <p className="text-destructive text-sm">{errors.desiredIndustry.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="preferredWorkArrangement">Preferred work arrangement</Label>
                <Controller
                  control={control}
                  name="preferredWorkArrangement"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="preferredWorkArrangement" className="w-full">
                        <SelectValue placeholder="Select an arrangement">
                          {(value: string) => WORK_ARRANGEMENTS.find((opt) => opt.value === value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_ARRANGEMENTS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.preferredWorkArrangement && (
                  <p className="text-destructive text-sm">
                    {errors.preferredWorkArrangement.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="preferredLocation">Preferred location</Label>
                <Input id="preferredLocation" {...register("preferredLocation")} />
                {errors.preferredLocation && (
                  <p className="text-destructive text-sm">{errors.preferredLocation.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salaryExpectationMin">Min salary (optional)</Label>
                  <Input
                    id="salaryExpectationMin"
                    type="number"
                    min={0}
                    {...register("salaryExpectationMin")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salaryExpectationMax">Max salary (optional)</Label>
                  <Input
                    id="salaryExpectationMax"
                    type="number"
                    min={0}
                    {...register("salaryExpectationMax")}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="interests">Professional interests (comma separated)</Label>
                <Input
                  id="interests"
                  placeholder="Web Development, AI Products"
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-muted-foreground text-sm">
                Add your most recent education. You can add more later from your resume. Optional —
                you can skip this step.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="education.institution">Institution</Label>
                <Input id="education.institution" {...register("education.institution")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="education.degree">Degree</Label>
                  <Input id="education.degree" {...register("education.degree")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="education.fieldOfStudy">Field of study</Label>
                  <Input id="education.fieldOfStudy" {...register("education.fieldOfStudy")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="education.startDate">Start date</Label>
                  <Input
                    id="education.startDate"
                    type="date"
                    {...register("education.startDate")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="education.endDate">End date</Label>
                  <Input id="education.endDate" type="date" {...register("education.endDate")} />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-muted-foreground text-sm">Select the skills you already have.</p>
              {Object.entries(skillsByCategory).map(([category, skills]) => (
                <div key={category} className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-xs uppercase">{category}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {skills.map((skill) => (
                      <label key={skill.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedSkillNames.includes(skill.name)}
                          onCheckedChange={(checked) => toggleSkill(skill.name, checked === true)}
                        />
                        {skill.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customSkills">Other skills (comma separated)</Label>
                <Input
                  id="customSkills"
                  placeholder="GraphQL, Figma"
                  value={customSkillsText}
                  onChange={(e) => setCustomSkillsText(e.target.value)}
                />
              </div>
            </>
          )}

          {serverError && <p className="text-destructive text-sm">{serverError}</p>}
        </CardContent>
        <CardFooter className="flex justify-between border-t-0 bg-transparent pt-2">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Finish"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
