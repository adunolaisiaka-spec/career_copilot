export function getClientIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
}
