"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
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

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setMessage(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => null);
    setMessage(body?.data?.message ?? body?.error ?? "Something went wrong. Please try again.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>We&apos;ll email you a reset link.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          {message && <p className="text-muted-foreground text-sm">{message}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 border-t-0 bg-transparent pt-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
