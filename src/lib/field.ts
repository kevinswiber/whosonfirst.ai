import type {
  DeploymentEvidence,
  ImplementationEvidence,
} from "../data/field/model.ts";

/** Carry early-release wording and material scope limits into every compact view. */
export function fieldQualification(
  entry: ImplementationEvidence | DeploymentEvidence,
): string {
  const release =
    entry.kind === "implementation" &&
    (entry.release.stage === "experimental" ||
      entry.release.stage === "preview")
      ? entry.release.label
      : undefined;
  return [release, entry.qualification].filter(Boolean).join(" · ");
}
