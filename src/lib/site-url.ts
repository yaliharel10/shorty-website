export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function filmPublicUrl(filmId: string) {
  return `${getSiteUrl()}/films/${filmId}`;
}
