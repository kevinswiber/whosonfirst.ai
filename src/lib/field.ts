import type { FieldProfile } from "../data/field";
import { deploymentOrganizations } from "../data/field";

/** The same bounded sample on the directory and on the mechanism guide. */
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
      options === 1 ? "1 documented option" : `${options} documented options`,
    operatorsLabel:
      operators === 1 ? "1 named operator" : `${operators} named operators`,
    productExamples: products.join(" · "),
  };
}
