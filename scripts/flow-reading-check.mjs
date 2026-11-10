// Authored-data checks include malformed cases that a valid site build cannot exercise.
import { strict as assert } from "node:assert";
import { validateFlowReading } from "../src/data/flow-reading.ts";

const fixture = () => ({
  slug: "example",
  steps: [{}, {}, {}],
  related: ["other"],
  notes: [{ id: "stopping", title: "Stopping", body: "Detail." }],
  reading: {
    brief: {
      authority: "The workload.",
      benefit: "No provisioned secret.",
      cost: "Trust configuration.",
      prerequisites: ["A supported issuer."],
      responsibilities: "Authorize the object.",
      alternatives: [
        {
          condition: "Another arrangement",
          label: "Other",
          href: "/flows/other/",
        },
        { condition: "Stopping", label: "Read", href: "#stopping" },
        {
          condition: "Documentation",
          label: "Source",
          href: "https://example.org/docs",
        },
      ],
    },
    phases: [
      { title: "Proof", summary: "Obtain proof.", start: 1, end: 1 },
      { title: "Access", summary: "Obtain access.", start: 2, end: 3 },
    ],
    decisions: {
      presentation: "inline",
      items: [
        {
          atStep: 2,
          title: "Reuse",
          benefit: "Fewer exchanges.",
          cost: "Cache handling.",
          mitigation: {
            action: "Isolate entries.",
            conditions: "Same context.",
            addedCost: "Expiry handling.",
            remaining: "Issued access can outlive trust.",
          },
          sources: [{ label: "Source", href: "https://example.org/docs" }],
        },
      ],
    },
  },
});
const slugs = new Set(["example", "other"]);
let checked = 0;
const check = (name, fn) => {
  fn();
  checked++;
  console.log(`  ✓ ${name}`);
};
check("unpiloted data remains accepted", () => {
  const f = fixture();
  delete f.reading;
  const before = structuredClone(f);
  validateFlowReading(f, slugs);
  assert.deepEqual(f, before);
});
check("valid inline content and all three alternative link forms", () =>
  validateFlowReading(fixture(), slugs),
);
check("valid table and its local anchor", () => {
  const f = fixture();
  f.reading.decisions.presentation = "table";
  f.reading.decisions.items.push({
    ...f.reading.decisions.items[0],
    atStep: 3,
    title: "Renew",
  });
  f.reading.brief.alternatives[1].href = "#decisions";
  validateFlowReading(f, slugs);
});
const reject = (name, change, diagnostic) =>
  check(name, () => {
    const f = fixture();
    change(f);
    assert.throws(() => validateFlowReading(f, slugs), diagnostic);
  });
reject(
  "phase gap",
  (f) => {
    f.reading.phases[1].start = 3;
  },
  /\[example\].*phase gap or overlap/,
);
reject(
  "phase overlap",
  (f) => {
    f.reading.phases[1].start = 1;
  },
  /\[example\].*phase gap or overlap/,
);
reject(
  "uncovered final step",
  (f) => {
    f.reading.phases[1].end = 2;
  },
  /phase gap at the end/,
);
reject(
  "out-of-range decision",
  (f) => {
    f.reading.decisions.items[0].atStep = 4;
  },
  /atStep 4/,
);
reject(
  "unknown flow",
  (f) => {
    f.reading.brief.alternatives[0].href = "/flows/missing/";
  },
  /unknown flow link/,
);
reject(
  "unknown local anchor",
  (f) => {
    f.reading.brief.alternatives[1].href = "#missing";
  },
  /unknown local anchor/,
);
reject(
  "table anchor absent in inline mode",
  (f) => {
    f.reading.brief.alternatives[1].href = "#decisions";
  },
  /unknown local anchor/,
);
reject(
  "duplicate note id",
  (f) => {
    f.notes.push({ ...f.notes[0] });
  },
  /duplicate note id/,
);
reject(
  "note id collides with step",
  (f) => {
    f.notes[0].id = "step-1";
  },
  /duplicate note id/,
);
reject(
  "unsupported alternative route",
  (f) => {
    f.reading.brief.alternatives[0].href = "/guide/";
  },
  /unsupported link/,
);
reject(
  "empty prerequisites",
  (f) => {
    f.reading.brief.prerequisites = [];
  },
  /brief.prerequisites/,
);
reject(
  "single-item table",
  (f) => {
    f.reading.decisions.presentation = "table";
  },
  /at least two/,
);
console.log(`\n${checked} reading checks passed.`);
