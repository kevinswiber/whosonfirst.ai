import type { FieldProfile } from "../data/field";
import { deploymentOrganizations } from "../data/field";

/** Coverage counts and bounded entries for the implementation directory. */
export function fieldSnapshot(profile: FieldProfile) {
  const options = profile.implementations.length;
  const operators = deploymentOrganizations(profile);
  return {
    implementations: profile.implementations.slice(0, 2),
    deployment: profile.deployments[0],
    optionsLabel:
      options === 1
        ? "1 entry in this review"
        : `${options} entries in this review`,
    operatorsLabel:
      operators === 1
        ? "1 operator covered in this review"
        : `${operators} operators covered in this review`,
  };
}
