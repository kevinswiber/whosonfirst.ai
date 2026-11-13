import type { FieldProfile } from "../data/field";
import { deploymentOrganizations } from "../data/field";

/** Coverage counts and bounded examples for the implementation directory. */
export function fieldSnapshot(profile: FieldProfile) {
  const options = profile.implementations.length;
  const products = [
    ...new Set(profile.implementations.map((entry) => entry.product)),
  ].slice(0, 2);
  const operators = deploymentOrganizations(profile);
  return {
    products,
    operator: profile.deployments[0]?.organization,
    optionsLabel:
      options === 1
        ? "1 entry in this review"
        : `${options} entries in this review`,
    operatorsLabel:
      operators === 1
        ? "1 operator covered in this review"
        : `${operators} operators covered in this review`,
    productExamples: products.join(" · "),
  };
}
