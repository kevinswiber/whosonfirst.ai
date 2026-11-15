// scripts/indexnow.mjs tells search engines which pages changed. This checks
// how it chooses them: by a day, or by the commits after one, and how it
// waits for the deployed site to have them. Nothing here builds the site,
// asks the network or sends a list.
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import {
  changedBy,
  changedSince,
  commitsAfter,
  notYetLive,
  readArgs,
  readSitemap,
  untilLive,
} from "../../scripts/indexnow.mjs";

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
    for (const args of [
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
    ])
      assert.equal(readArgs(args), undefined, args.join(" "));
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

  test("by some commits: the pages whose date is the date of one of them, however old", () => {
    // a commit made on the 12th and merged after one made on the 14th
    assert.deepEqual(locs(changedBy(pages, ["2026-11-12T09:00:00+00:00"])), [
      "/",
    ]);
    assert.deepEqual(locs(changedBy(pages, [])), []);
    assert.deepEqual(locs(changedBy(pages, ["2026-11-14T10:00:01+00:00"])), []);
  });

  test("a commit's date and a page's are the same instant in whatever zone each is written", () => {
    assert.deepEqual(
      locs(
        changedBy(pages, [
          "2026-11-14T07:30:00+00:00",
          "2026-11-14T02:00:00-08:00",
        ]),
      ),
      ["/about/", "/flows/dpop/"],
    );
  });

  test("a page with no date is never taken for changed", () => {
    assert.ok(
      !locs(changedSince(pages, "2000-01-01")).includes("/styleguide/"),
    );
  });
});

describe("the commits after one", () => {
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
  const commit = (name, date) => {
    writeFileSync(join(root, "page.txt"), name);
    git(root, "add", "page.txt");
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

  // one, two, three on main; "rewritten" is a second commit on one, as main
  // would be after a forced push that replaced two and three
  before(() => {
    root = mkdtempSync(join(tmpdir(), "indexnow-"));
    git(root, "init", "--quiet", "--initial-branch=main");
    commit("one", "2026-11-10T08:00:00+00:00");
    commit("two", "2026-11-11T08:00:00+00:00");
    commit("three", "2026-11-12T08:00:00+00:00");
    git(root, "checkout", "--quiet", "-b", "rewritten", hashes.one);
    commit("rewritten", "2026-11-13T08:00:00+00:00");
    git(root, "checkout", "--quiet", "main");
    shallow = mkdtempSync(join(tmpdir(), "indexnow-shallow-"));
    git(shallow, "clone", "--quiet", "--depth=1", `file://${root}`, ".");
  });
  after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(shallow, { recursive: true, force: true });
  });

  test("are those made since, newest first, and none for the commit checked out", () => {
    assert.deepEqual(commitsAfter(root, hashes.one), {
      dates: ["2026-11-12T08:00:00+00:00", "2026-11-11T08:00:00+00:00"],
    });
    assert.deepEqual(commitsAfter(root, hashes.three), { dates: [] });
    assert.deepEqual(commitsAfter(root, hashes.two.slice(0, 10)), {
      dates: ["2026-11-12T08:00:00+00:00"],
    });
  });

  test("where history was rewritten, are those that are here and were not there", () => {
    git(root, "checkout", "--quiet", "rewritten");
    try {
      // main was at three, and is now at a commit three is not behind
      assert.deepEqual(commitsAfter(root, hashes.three), {
        dates: ["2026-11-13T08:00:00+00:00"],
      });
    } finally {
      git(root, "checkout", "--quiet", "main");
    }
  });

  test("leave out a commit that only reformats", () => {
    writeFileSync(join(root, ".git-blame-ignore-revs"), `${hashes.three}\n`);
    try {
      assert.deepEqual(commitsAfter(root, hashes.one), {
        dates: ["2026-11-11T08:00:00+00:00"],
      });
    } finally {
      rmSync(join(root, ".git-blame-ignore-revs"));
    }
  });

  test("are every commit, for the all-zero name of the commit before a first push", () => {
    assert.deepEqual(commitsAfter(root, "0".repeat(40)), { all: true });
  });

  test("are refused for a commit this clone does not have, by name", () => {
    const { refused, dates } = commitsAfter(root, "f".repeat(40));
    assert.equal(dates, undefined);
    assert.match(refused, /no commit f{40}/);
  });

  test("are refused in a shallow clone, whose build has no dates to find them by", () => {
    assert.match(commitsAfter(shallow, hashes.two).refused, /shallow/);
  });

  test("are refused where there is no repository", () => {
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
