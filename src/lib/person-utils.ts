export const PERSON_ROLES = [
  { id: "actor", label: "Actor" },
  { id: "director", label: "Director" },
  { id: "writer", label: "Writer" },
  { id: "producer", label: "Producer" },
  { id: "cinematographer", label: "Cinematographer" },
  { id: "editor", label: "Editor" },
  { id: "composer", label: "Composer" },
] as const;

export type PersonRoleId = (typeof PERSON_ROLES)[number]["id"];

export function roleLabel(role: string) {
  return PERSON_ROLES.find((r) => r.id === role)?.label ?? role;
}

export function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
