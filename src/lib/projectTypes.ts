import type { ProjectTypeDef } from "./types";
import { typeLabels } from "./utils";

// Built-in project types are permanent and not stored in the database.
// Their labels live in `typeLabels` (utils.ts); their icons in TypeBadge.
export const BUILTIN_TYPE_SLUGS = ["code", "business", "life"] as const;

export const UNCATEGORIZED_LABEL = "Uncategorized";

// Display label for a type slug: built-in label, else a custom type's label,
// else "Uncategorized" (e.g. a project whose custom type was deleted).
export function typeLabelFor(
  slug: string | undefined | null,
  custom: ProjectTypeDef[]
): string {
  if (!slug) return UNCATEGORIZED_LABEL;
  if (typeLabels[slug]) return typeLabels[slug];
  const match = custom.find((t) => t.slug === slug);
  return match ? match.label : UNCATEGORIZED_LABEL;
}

// Every slug that currently resolves to a real type (built-in ∪ custom).
export function knownTypeSlugs(custom: ProjectTypeDef[]): Set<string> {
  return new Set<string>([...BUILTIN_TYPE_SLUGS, ...custom.map((t) => t.slug)]);
}

// A project is "uncategorized" when its type slug matches no known type.
export function isUncategorized(
  slug: string | undefined | null,
  custom: ProjectTypeDef[]
): boolean {
  return !slug || !knownTypeSlugs(custom).has(slug);
}

// Turn a free-text label into a url-safe slug: "Bene Studios" -> "bene-studios".
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
