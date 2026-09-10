import { describe, expect, it } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // email is lowercased/trimmed
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects a password without an uppercase letter", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short full name", () => {
    const result = registerSchema.safeParse({
      fullName: "A",
      email: "ada@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "not-an-email",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password (strength not enforced at login)", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema / resetPasswordSchema", () => {
  it("requires a valid email for forgot-password", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("requires a token and a strong password for reset-password", () => {
    expect(resetPasswordSchema.safeParse({ token: "", password: "Password123" }).success).toBe(
      false,
    );
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "weak" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "Password123" }).success).toBe(
      true,
    );
  });
});
