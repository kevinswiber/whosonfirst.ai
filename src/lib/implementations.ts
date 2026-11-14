import type {
  DeploymentEvidence,
  ImplementationEvidence,
} from "../data/implementations/model.ts";

/** Carry early-release wording and material scope limits into every compact view. */
export function evidenceQualification(
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
