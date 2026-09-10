"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resumeContentSchema,
  type ResumeContentFormInput,
  type ResumeContentInput,
} from "@/lib/validation/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface ResumeFormProps {
  mode: "create" | "edit";
  resumeId?: string;
  initialValues?: Partial<ResumeContentFormInput>;
}

const emptyDefaults: ResumeContentFormInput = {
  title: "",
  isPrimary: false,
  personalInfo: { fullName: "" },
  summary: "",
  awards: [],
  references: [],
};

export function ResumeForm({ mode, resumeId, initialValues }: ResumeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResumeContentFormInput, unknown, ResumeContentInput>({
    resolver: zodResolver(resumeContentSchema),
    defaultValues: { ...emptyDefaults, ...initialValues },
  });

  const awards = useFieldArray({ control, name: "awards" });
  const references = useFieldArray({ control, name: "references" });

  const onSubmit = async (values: ResumeContentInput) => {
    setServerError(null);
    const url = mode === "create" ? "/api/resumes" : `/api/resumes/${resumeId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/resume");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "New resume" : "Edit resume"}</CardTitle>
          <CardDescription>
            Education, experience, projects, and certifications are shared from your profile
            background — manage those from the Background section.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Resume title</Label>
            <Input id="title" placeholder="e.g. Frontend Developer Resume" {...register("title")} />
            {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...register("isPrimary")} /> Set as primary resume
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.fullName">Full name</Label>
            <Input id="personalInfo.fullName" {...register("personalInfo.fullName")} />
            {errors.personalInfo?.fullName && (
              <p className="text-destructive text-sm">{errors.personalInfo.fullName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.email">Email</Label>
            <Input id="personalInfo.email" {...register("personalInfo.email")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.phone">Phone</Label>
            <Input id="personalInfo.phone" {...register("personalInfo.phone")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.location">Location</Label>
            <Input id="personalInfo.location" {...register("personalInfo.location")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.linkedin">LinkedIn</Label>
            <Input id="personalInfo.linkedin" {...register("personalInfo.linkedin")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.portfolio">Portfolio</Label>
            <Input id="personalInfo.portfolio" {...register("personalInfo.portfolio")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personalInfo.github">GitHub</Label>
            <Input id="personalInfo.github" {...register("personalInfo.github")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Professional summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} {...register("summary")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Awards (optional)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {awards.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 gap-2 rounded-md border p-2">
              <Input placeholder="Title" {...register(`awards.${index}.title` as const)} />
              <Input placeholder="Issuer" {...register(`awards.${index}.issuer` as const)} />
              <Input
                placeholder="Date"
                type="date"
                {...register(`awards.${index}.date` as const)}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => awards.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => awards.append({ title: "" })}
          >
            Add award
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">References (optional)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {references.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 gap-2 rounded-md border p-2">
              <Input placeholder="Name" {...register(`references.${index}.name` as const)} />
              <Input
                placeholder="Relationship"
                {...register(`references.${index}.relationship` as const)}
              />
              <Input placeholder="Contact" {...register(`references.${index}.contact` as const)} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => references.remove(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => references.append({ name: "" })}
          >
            Add reference
          </Button>
        </CardContent>
      </Card>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      <CardFooter className="justify-start p-0">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save resume"}
        </Button>
      </CardFooter>
    </form>
  );
}
