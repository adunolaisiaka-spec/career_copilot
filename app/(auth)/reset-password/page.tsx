"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This reset link is missing its token. Request a new one from the{" "}
            <Link
              href="/forgot-password"
              className="text-primary underline-offset-4 hover:underline"
            >
              forgot password
            </Link>{" "}
            page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>Redirecting you to login…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("token")} />
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>
          {serverError && <p className="text-destructive text-sm">{serverError}</p>}
        </CardContent>
        <CardFooter className="border-t-0 bg-transparent pt-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
