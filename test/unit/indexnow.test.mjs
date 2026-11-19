// scripts/indexnow.mjs tells search engines which pages changed. This checks
// how it chooses them: by a day, or by what the commits after one changed,
// and how it waits for the deployed site to have them. Nothing here builds the site,
// asks the network or sends a list.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { assert, cleanup, describe, test } from "ubqtest";
import {
  changedBy,
  changedEntries,
  changedSince,
  commitsAfter,
  notYetLive,
  readArgs,
  readSitemap,
  untilLive,
} from "../../scripts/indexnow.mjs";

// the repositories the tests of commitsAfter make, removed when the file ends
const made = [];
cleanup(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

const url = (path, lastmod) =>
  `  <url><loc>https://example.test${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
const sitemap = (...urls) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
// as src/pages/sitemap.xml.ts writes it
const BUILT = sitemap(
  url("/", "2026-11-12T09:00:00+00:00"),
  url("/about/", "2026-11-13T23:30:00-08:00"),
  url("/flows/dpop/", "2026-11-14T10:00:00+00:00"),
  url("/styleguide/"),
);
const pages = readSitemap(BUILT);
const locs = (list) => list.map((p) => new URL(p.loc).pathname);

describe("what the command line asks for", () => {
  test("a day, a commit or every page, with a dry run and a wait", () => {
    assert.deepEqual(readArgs(["--since", "2026-11-14"]), {
      day: "2026-11-14",
      dryRun: false,
      wait: false,
    });
    assert.deepEqual(readArgs(["--dry-run", "--since", "4c1c6a6", "--wait"]), {
      commit: "4c1c6a6",
      dryRun: true,
      wait: true,
    });
    assert.deepEqual(readArgs(["--all", "--dry-run"]), {
      all: true,
      dryRun: true,
      wait: false,
    });
    assert.equal(readArgs(["--since", "0".repeat(40)]).commit, "0".repeat(40));
  });

  test("it is refused when it does not say which pages, says it twice or says something else", () => {
    const accepted = [
      [],
      ["--dry-run"],
      ["--all", "--since", "2026-11-14"],
      ["--since"],
      ["--since", "--dry-run"],
      ["--since", "yesterday"],
      ["--since", "2026-13-45"],
      ["--since", "2026-11-14T10:00:00Z"],
      ["--since", "main"],
      ["--since", "4C1C6A6"],
      ["--since", "abc"],
      ["--all", "--force"],
      ["--all", "2026-11-14"],
    ].filter((args) => readArgs(args) !== undefined);
    assert.deepEqual(accepted, []);
  });
});

describe("which pages changed", () => {
  test("a sitemap is read as its pages, each with its date where it has one", () => {
    assert.deepEqual(pages[0], {
      loc: "https://example.test/",
      lastmod: "2026-11-12T09:00:00+00:00",
    });
    assert.deepEqual(pages[3], {
      loc: "https://example.test/styleguide/",
      lastmod: undefined,
    });
  });

  test("since a day: the pages dated on or after it, the day starting in UTC", () => {
    // 23:30 on the 13th at -08:00 is 07:30 on the 14th in UTC
    assert.deepEqual(locs(changedSince(pages, "2026-11-14")), [
      "/about/",
      "/flows/dpop/",
    ]);
    assert.deepEqual(locs(changedSince(pages, "2026-11-15")), []);
  });

  // what each page is made from, as src/pages/sitemap-sources.json.ts writes it
  const sources = {
    "https://example.test/": ["src/pages/index.astro"],
    "https://example.test/about/": [
      "src/pages/about.astro",
      "src/pages/about.mdx",
    ],
    "https://example.test/flows/dpop/": [
      "src/data/flows/dpop.ts",
      "src/data/standards.ts#rfc9449",
    ],
    "https://example.test/styleguide/": [
      "src/pages/styleguide/index.astro",
      "src/data/flows/",
    ],
  };

  test("by some commits: the pages made from a file they changed, whatever its date says", () => {
    // a commit made on the 12th, merged after one made on the 14th that also
    // changed the page: its date stays the 14th
    assert.deepEqual(
      locs(changedBy(pages, sources, ["src/data/flows/dpop.ts"])),
      ["/flows/dpop/", "/styleguide/"],
    );
    assert.deepEqual(locs(changedBy(pages, sources, ["src/pages/about.mdx"])), [
      "/about/",
    ]);
    assert.deepEqual(locs(changedBy(pages, sources, [])), []);
    assert.deepEqual(locs(changedBy(pages, sources, ["README.md"])), []);
  });

  test("by some commits: a page made from an entry, only when that entry changed", () => {
    assert.deepEqual(
      locs(
        changedBy(pages, sources, [
          "src/data/standards.ts",
          "src/data/standards.ts#rfc9449",
        ]),
      ),
      ["/flows/dpop/"],
    );
    assert.deepEqual(
      locs(
        changedBy(pages, sources, [
          "src/data/standards.ts",
          "src/data/standards.ts#rfc7519",
        ]),
      ),
      [],
    );
  });

  test("by some commits: a directory is made of every file under it, and of no entry", () => {
    assert.deepEqual(
      locs(changedBy(pages, sources, ["src/data/flows/gnap.ts"])),
      ["/styleguide/"],
    );
    assert.deepEqual(
      locs(changedBy(pages, sources, ["src/data/flowsheet.ts"])),
      [],
    );
  });

  test("by some commits: a page the build named no sources for is not sent", () => {
    assert.deepEqual(locs(changedBy(pages, {}, ["src/pages/index.astro"])), []);
  });

  test("a page with no date is never taken for changed", () => {
    assert(!locs(changedSince(pages, "2000-01-01")).includes("/styleguide/"));
  });
});

// a list of entries, laid out as Biome lays it out, or laid out otherwise
const list = (entries, loose = false) =>
  `export const standards = [\n${entries
    .map(([id, name]) =>
      loose
        ? `  {\n    id:   "${id}",\n    name:  "${name}"\n  },`
        : `  {\n    id: "${id}",\n    name: "${name}",\n  },`,
    )
    .join("\n")}\n];\n`;

describe("which entries changed", () => {
  test("those added, taken away, or whose text is not the same", () => {
    assert.deepEqual(
      changedEntries(
        list([
          ["a", "A"],
          ["b", "B"],
          ["c", "C"],
        ]),
        list([
          ["a", "A"],
          ["b", "B, again"],
          ["d", "D"],
        ]),
        "id",
      ).sort(),
      ["b", "c", "d"],
    );
  });

  test("none, where only the layout changed", () => {
    const entries = [
      ["a", "A"],
      ["b", "B"],
    ];
    assert.deepEqual(
      changedEntries(list(entries), list(entries, true), "id"),
      [],
    );
  });

  test("every one, in a file that was not there before", () => {
    assert.deepEqual(changedEntries("", list([["a", "A"]]), "id"), ["a"]);
  });
});

describe("what the commits after one changed", () => {
  let root;
  let shallow;
  const hashes = {};
  // a repository of its own, with nothing of this machine's git settings
  const run = (cwd, env, ...args) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Test",
        "-c",
        "user.email=test@example.test",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", ...env },
      },
    ).trim();
  const git = (cwd, ...args) => run(cwd, {}, ...args);
  const STANDARDS = "src/data/standards.ts";
  const commit = (name, date, files) => {
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), text);
      git(root, "add", file);
    }
    run(
      root,
      { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
      "commit",
      "--quiet",
      "-m",
      name,
    );
    hashes[name] = git(root, "rev-parse", "HEAD");
  };

  const changed = (cwd, from) => commitsAfter(cwd, from).changed.sort();

  // one, two, three and four on main; "rewritten" is a second commit on one,
  // as main would be after a forced push that replaced the rest. Two changes
  // an entry of the list, three another file, and four only the list's layout.
  let ready = false;
  const setup = () => {
    if (ready) return;
    ready = true;
    root = mkdtempSync(join(tmpdir(), "indexnow-"));
    made.push(root);
    git(root, "init", "--quiet", "--initial-branch=main");
    const entries = [
      ["a", "A"],
      ["b", "B, again"],
    ];
    commit("one", "2026-11-10T08:00:00+00:00", {
      "page.txt": "one",
      [STANDARDS]: list([
        ["a", "A"],
        ["b", "B"],
      ]),
    });
    commit("two", "2026-11-11T08:00:00+00:00", {
      "page.txt": "two",
      [STANDARDS]: list(entries),
    });
    commit("three", "2026-11-12T08:00:00+00:00", { "other.txt": "three" });
    commit("four", "2026-11-13T08:00:00+00:00", {
      [STANDARDS]: list(entries, true),
    });
    git(root, "checkout", "--quiet", "-b", "rewritten", hashes.one);
    commit("rewritten", "2026-11-14T08:00:00+00:00", {
      "page.txt": "rewritten",
    });
    git(root, "checkout", "--quiet", "main");
    shallow = mkdtempSync(join(tmpdir(), "indexnow-shallow-"));
    made.push(shallow);
    git(shallow, "clone", "--quiet", "--depth=1", `file://${root}`, ".");
  };

  test("is the files they touched, and the entries whose text they changed", () => {
    setup();
    assert.deepEqual(changed(root, hashes.one), [
      "other.txt",
      "page.txt",
      STANDARDS,
      `${STANDARDS}#b`,
    ]);
    assert.deepEqual(changed(root, hashes.two.slice(0, 10)), [
      "other.txt",
      STANDARDS,
    ]);
    assert.deepEqual(changed(root, hashes.four), []);
  });

  test("is no entry, where a commit only laid out the list again", () => {
    setup();
    assert.deepEqual(changed(root, hashes.three), [STANDARDS]);
  });

  test("where history was rewritten, is what the commits here and not there changed", () => {
    setup();
    git(root, "checkout", "--quiet", "rewritten");
    try {
      // main was at four, and is now at a commit four is not behind
      assert.deepEqual(changed(root, hashes.four), ["page.txt"]);
    } finally {
      git(root, "checkout", "--quiet", "main");
    }
  });

  test("leaves out what a commit that only reformats touched", () => {
    setup();
    writeFileSync(
      join(root, ".git-blame-ignore-revs"),
      `${hashes.three}\n${hashes.four}\n`,
    );
    try {
      assert.deepEqual(changed(root, hashes.two), []);
      assert.deepEqual(changed(root, hashes.one), [
        "page.txt",
        STANDARDS,
        `${STANDARDS}#b`,
      ]);
    } finally {
      rmSync(join(root, ".git-blame-ignore-revs"));
    }
  });

  test("is everything, for the all-zero name of the commit before a first push", () => {
    setup();
    assert.deepEqual(commitsAfter(root, "0".repeat(40)), { all: true });
  });

  test("is refused for a commit this clone does not have, by name", () => {
    setup();
    const { refused, changed } = commitsAfter(root, "f".repeat(40));
    assert.equal(changed, undefined);
    assert.match(refused, /no commit f{40}/);
  });

  test("is refused in a shallow clone, whose history cannot say", () => {
    setup();
    assert.match(commitsAfter(shallow, hashes.two).refused, /shallow/);
  });

  test("is refused where there is no repository", () => {
    assert.match(commitsAfter("/", hashes.one).refused, /no history/);
  });
});

describe("waiting for the deploy", () => {
  const sending = pages.slice(1, 3); // /about/ and /flows/dpop/
  const before = sitemap(
    url("/", "2026-11-12T09:00:00+00:00"),
    url("/about/", "2026-11-10T09:00:00+00:00"),
    url("/styleguide/"),
  );
  // a clock that moves only when the wait sleeps
  const clock = () => {
    let at = 0;
    return {
      now: () => at,
      sleep: async (ms) => {
        at += ms;
      },
    };
  };

  test("a page is not there while the deployed sitemap leaves it out or dates it earlier", () => {
    assert.deepEqual(locs(notYetLive(sending, readSitemap(before))), [
      "/about/",
      "/flows/dpop/",
    ]);
    assert.deepEqual(notYetLive(sending, pages), []);
  });

  test("a page is there when a later deploy has changed it again, or writes its date in another zone", () => {
    const later = readSitemap(
      sitemap(
        url("/about/", "2026-11-14T07:30:00+00:00"),
        url("/flows/dpop/", "2026-11-15T12:00:00+00:00"),
      ),
    );
    assert.deepEqual(notYetLive(sending, later), []);
  });

  test("a deployed site whose build dated nothing never has a dated page", () => {
    const undated = readSitemap(sitemap(url("/about/"), url("/flows/dpop/")));
    assert.equal(notYetLive(sending, undated).length, 2);
  });

  test("a page this build could not date only has to be listed", () => {
    const all = pages.slice(3);
    assert.deepEqual(notYetLive(all, readSitemap(before)), []);
    assert.equal(notYetLive(all, []).length, 1);
  });

  test("it goes on as soon as the deployed site has the pages, and not before", async () => {
    const { now, sleep } = clock();
    const answers = [
      () => before,
      () => {
        throw new Error("503");
      },
      () => before,
      () => BUILT,
    ];
    let reads = 0;
    const said = [];
    const result = await untilLive(sending, async () => answers[reads++](), {
      limit: 600_000,
      every: 15_000,
      now,
      sleep,
      say: (line) => said.push(line),
    });
    assert.deepEqual(result, { live: true });
    assert.equal(reads, 4);
    assert.equal(now(), 45_000);
    assert.match(said[0], /does not have 2 of 2 pages yet/);
    assert.match(said[1], /could not be read \(503\)/);
  });

  test("it does not wait at all for a site that already has them", async () => {
    const { now, sleep } = clock();
    const result = await untilLive(sending, async () => BUILT, { now, sleep });
    assert.deepEqual(result, { live: true });
    assert.equal(now(), 0);
  });

  test("it gives up at the limit and names the pages still missing", async () => {
    const { now, sleep } = clock();
    let reads = 0;
    const result = await untilLive(
      sending,
      async () => {
        reads++;
        return before;
      },
      { limit: 60_000, every: 15_000, now, sleep },
    );
    assert.equal(result.live, false);
    assert.deepEqual(locs(result.behind), ["/about/", "/flows/dpop/"]);
    assert.equal(result.problem, undefined);
    // at 0, 15, 30, 45 and 60 seconds, and never past the limit
    assert.equal(reads, 5);
    assert.equal(now(), 60_000);
  });

  test("it gives up on a sitemap that cannot be read, and says why", async () => {
    const { now, sleep } = clock();
    const result = await untilLive(
      sending,
      async () => {
        throw new Error("403");
      },
      { limit: 30_000, every: 15_000, now, sleep },
    );
    assert.equal(result.live, false);
    assert.equal(result.problem, "403");
    assert.equal(result.behind.length, 2);
  });
});
