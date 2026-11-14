import { flows } from "../flows";
import { publishProfile, validateProfiles } from "./model.ts";
import { profiles } from "./records.ts";

validateProfiles(
  profiles,
  flows.map((flow) => flow.slug),
  Object.fromEntries(
    flows.map((flow) => [
      flow.slug,
      flow.participants.filter((p) => p.role !== "human").map((p) => p.id),
    ]),
  ),
);
export const implementationProfiles = profiles.map(publishProfile);
export const implementationProfile = (slug: string) =>
  implementationProfiles.find((profile) => profile.slug === slug);
export * from "./model.ts";
