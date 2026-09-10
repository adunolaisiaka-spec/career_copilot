"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Skill } from "@prisma/client";
import {
  profileUpdateSchema,
  type ProfileUpdateFormInput,
  type ProfileUpdateInput,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CAREER_LEVELS: { value: ProfileUpdateInput["careerLevel"]; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "ENTRY", label: "Entry level" },
  { value: "MID", label: "Mid level" },
  { value: "SENIOR", label: "Senior" },
  { value: "LEAD", label: "Lead" },
  { value: "EXECUTIVE", label: "Executive" },
];

const WORK_ARRANGEMENTS: {
  value: ProfileUpdateInput["preferredWorkArrangement"];
  label: string;
}[] = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

interface ProfileFormProps {
  skillCatalog: Skill[];
  initialValues: Partial<ProfileUpdateFormInput> & { selectedSkillNames: string[] };
}

export function ProfileForm({ skillCatalog, initialValues }: ProfileFormProps) {
  const [interestsText, setInterestsText] = useState(
    initialValues.professionalInterests?.join(", ") ?? "",
  );
  const [customSkillsText, setCustomSkillsText] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateFormInput, unknown, ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: initialValues.fullName ?? "",
      location: initialValues.location ?? "",
      careerLevel: initialValues.careerLevel,
      yearsExperience: initialValues.yearsExperience ?? 0,
      currentJobTitle: initialValues.currentJobTitle ?? "",
      desiredJobTitle: initialValues.desiredJobTitle ?? "",
      desiredIndustry: initialValues.desiredIndustry ?? "",
      preferredWorkArrangement: initialValues.preferredWorkArrangement,
      preferredLocation: initialValues.preferredLocation ?? "",
      salaryExpectationMin: initialValues.salaryExpectationMin,
      salaryExpectationMax: initialValues.salaryExpectationMax,
      professionalInterests: initialValues.professionalInterests ?? [],
      skillNames: initialValues.selectedSkillNames,
    },
  });

  const selectedSkillNames = watch("skillNames") ?? [];

  const toggleSkill = (name: string, checked: boolean) => {
    const current = new Set(selectedSkillNames);
    if (checked) current.add(name);
    else current.delete(name);
    setValue("skillNames", [...current], { shouldValidate: true });
  };

  const onSubmit = async (values: ProfileUpdateInput) => {
    setServerError(null);
    setSuccess(false);

    const interests = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const customSkills = customSkillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: ProfileUpdateInput = {
      ...values,
      professionalInterests: interests,
      skillNames: [...new Set([...values.skillNames, ...customSkills])],
    };

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    setCustomSkillsText("");
    setSuccess(true);
  };

  const skillsByCategory = skillCatalog.reduce<Record<string, Skill[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>Keep this up to date for better AI recommendations.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-destructive text-sm">{errors.fullName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
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
            <Input id="yearsExperience" type="number" min={0} {...register("yearsExperience")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentJobTitle">Current job title</Label>
            <Input id="currentJobTitle" {...register("currentJobTitle")} />
          </div>
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
              <p className="text-destructive text-sm">{errors.preferredWorkArrangement.message}</p>
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
              <Label htmlFor="salaryExpectationMin">Min salary</Label>
              <Input
                id="salaryExpectationMin"
                type="number"
                min={0}
                {...register("salaryExpectationMin")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salaryExpectationMax">Max salary</Label>
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
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Skills</Label>
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
            <Input
              placeholder="Other skills (comma separated)"
              value={customSkillsText}
              onChange={(e) => setCustomSkillsText(e.target.value)}
            />
          </div>

          {serverError && <p className="text-destructive text-sm">{serverError}</p>}
          {success && <p className="text-sm text-emerald-600">Profile updated.</p>}
        </CardContent>
        <CardFooter className="border-t-0 bg-transparent pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
