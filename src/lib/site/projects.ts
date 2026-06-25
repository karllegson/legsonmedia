import type { HomeImageKey } from "@/lib/site/images";

/** Project portfolio — add completed and in-progress work here or via admin. */
export type ProjectType =
  | "Apartments"
  | "Condominiums"
  | "Custom Homes"
  | "Production Homes"
  | "Multi-Family";

export type ProjectStatus = "completed" | "current";

export type Project = {
  id: string;
  name: string;
  location: string;
  builder: string;
  type: ProjectType;
  status: ProjectStatus;
  citySlug?: string;
  image: HomeImageKey;
  blurb: string;
};

export const completedProjects: Project[] = [];

export const currentProjects: Project[] = [];

export const projectsIntro =
  "Add your completed and in-progress projects here. This section showcases your portfolio to visitors.";

export const projectsPageHeading = "Our Projects";

export const allProjects: Project[] = [...currentProjects, ...completedProjects];

/** Projects tied to a specific service-area city (for city pages). */
export function projectsForCity(citySlug: string): Project[] {
  return allProjects.filter((project) => project.citySlug === citySlug);
}
