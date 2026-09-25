/** Maps a 0-100 score to a consistent Badge variant across the app (resume, interviews). */
export function scoreBadgeVariant(score: number): "success" | "warning" | "outline" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "outline";
}
