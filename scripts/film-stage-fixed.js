/**
 * Another stage for a flow's film, to set beside scripts/film-stage.js: a
 * prototype. This file runs in the page that scripts/flow-film.mjs opens with
 * `--layout fixed`, not in Node.
 *
 * On the first stage a step is a row, and rows come and go. On this one the
 * parties stay where they are for the whole film, with a line between each
 * pair that speaks to each other, and the only thing that moves is what is
 * sent. The agent stands at the left, as tall as the stage, with what it
 * holds inside it. The other parties stand at the right, one above another,
 * and a line runs from the agent to each.
 *
 * What it gives up is the page's drawing: there are no rows, so the order of
 * the steps is not on the stage as a place. Each thing sent carries its
 * step's number, and a strip of numbers says how far the flow has got.
 *
 * It takes the same `window.FILM` and gives the same `window.seek(t)`. The
 * part that places things in time is the same as the first stage's, copied:
 * if this stage is kept, the two should share it.
 */
(() => {
  const film = window.FILM;
  const { flow, beats } = film;
  const stage = document.getElementById("scene");

  // ---------- where things are, in a stage of 1920 by 1080 ----------
  /** The agent: a tall box at the left, with what it holds inside it. */
  const AGENT = { x: 290, top: 190, w: 320, h: 480 };
  const LEFT = AGENT.x + AGENT.w / 2; // where its lines leave it
  /** The other parties: boxes at the right, between these two heights. */
  const RIGHT = { x: 1570, w: 380, h: 104, first: 250, last: 620 };
  const NEAR = RIGHT.x - RIGHT.w / 2; // where a line reaches one
  /** Where the agent holds things, inside its box: the first, and the second under it. */
  const SLOT = [330, 400];
  const KEYSTORE_Y = 584;
  /** Between the agent and the others: where a listing is shown. */
  const MIDDLE = (LEFT + NEAR) / 2;
  /** Where someone else stands, when someone else has a copy of the token. */
  const OTHER = { x: 720, y: 760, w: 400 };
  const DIM = 0.3;

  const agent = flow.participants.find((p) => p.role === "agent");
  const rest = flow.participants.filter((p) => p !== agent);
  const parties = [
    { ...agent, x: AGENT.x, y: AGENT.top + AGENT.h / 2 },
    ...rest.map((p, i) => ({
      ...p,
      x: RIGHT.x,
      y:
        RIGHT.first +
        (i * (RIGHT.last - RIGHT.first)) / Math.max(1, rest.length - 1),
    })),
  ];
  const party = (id) => parties.find((p) => p.id === id);
  const me = parties[0];
  const api = parties.find((p) => p.role === "resource");
  const others = parties.filter((p) => p !== me && p !== api).map((p) => p.id);
  /**
   * While only the agent and the API take part, before the flow and after
   * it, the API stands level with the middle of the agent, and the line
   * between them is at that height. For the flow it is in its place below.
   */
  const TWO = me.y;

  // ---------- making things ----------
  const make = (tag, cls, parent = stage, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    parent.append(node);
    return node;
  };
  const svg = (tag, attrs, parent) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [name, value] of Object.entries(attrs))
      node.setAttribute(name, value);
    parent.append(node);
    return node;
  };
  const at = (node, x, y) => {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    return node;
  };

  // ---------- where each thing is at which second ----------
  const START = { opacity: 0, x: 0, y: 0, scale: 1, draw: 0, dim: 0, lift: 0 };
  const tracks = [];
  const trackOf = (node, prop) => {
    let found = tracks.find((t) => t.node === node && t.prop === prop);
    if (!found) {
      found = { node, prop, keys: [] };
      tracks.push(found);
    }
    return found;
  };
  const to = (node, prop, t, dur, value, ease = "inOut") => {
    const { keys } = trackOf(node, prop);
    const before = keys.length ? keys[keys.length - 1].v : START[prop];
    keys.push(
      { t, v: before },
      { t: t + Math.max(dur, 0.001), v: value, ease },
    );
  };
  const from = (node, prop, value) => {
    trackOf(node, prop).keys.push({ t: -1, v: value });
  };
  const show = (node, t, dur = 0.35, value = 1) =>
    to(node, "opacity", t, dur, value);
  const hide = (node, t, dur = 0.3) => to(node, "opacity", t, dur, 0);
  const pop = (node, t) => {
    show(node, t, 0.25);
    to(node, "scale", t, 0.001, 0.8);
    to(node, "scale", t, 0.3, 1, "out");
  };
  const EASE = {
    inOut: (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
    out: (p) => 1 - (1 - p) ** 3,
    // for a thing sent: it leaves slowly, is quickest half way, and slows to a stop
    travel: (p) => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2),
  };
  const valueAt = ({ keys, prop }, t) => {
    let i = -1;
    for (let k = 0; k < keys.length && keys[k].t <= t; k++) i = k;
    if (i < 0) return keys.length ? keys[0].v : START[prop];
    const a = keys[i];
    const b = keys[i + 1];
    if (!b || b.t <= a.t) return a.v;
    const p = EASE[b.ease ?? "inOut"]((t - a.t) / (b.t - a.t));
    return a.v + (b.v - a.v) * p;
  };

  // ---------- the parties, and the line from the agent to each ----------
  const lines = svg(
    "svg",
    { class: "lines", width: 1920, height: 1080 },
    stage,
  );
  me.box = at(make("div", `party tall role-${me.role}`), me.x, me.y);
  me.box.style.width = `${AGENT.w}px`;
  me.box.style.height = `${AGENT.h}px`;
  make("strong", "", me.box, me.label);
  for (const p of parties.slice(1)) {
    p.box = at(make("div", `party role-${p.role}`), p.x, p.y);
    p.box.style.width = `${RIGHT.w}px`;
    make("strong", "", p.box, p.label);
    p.line = svg(
      "line",
      { class: "channel", x1: LEFT, x2: NEAR, y1: p.y, y2: p.y },
      lines,
    );
  }
  /**
   * Who is taking part: the others are dimmed, and one named in `gone` is not
   * there at all. A line is lit when the party at its far end is.
   */
  const light = (t, ids, gone = []) => {
    for (const p of parties) {
      const level = gone.includes(p.id) ? 0 : ids.includes(p.id) ? 1 : DIM;
      to(p.box, "opacity", t, 0.4, level);
      if (p.line) to(p.line, "opacity", t, 0.4, level);
    }
  };

  const KEY =
    '<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.5"/><path d="M12.5 12H22M18 12v4M21.5 12v3"/></svg>';
  const chip = (kind, x, y) => {
    const node = at(make("div", `held held-${kind}`), x, y);
    node.innerHTML =
      kind === "key"
        ? `${KEY}<span>private key</span>`
        : kind === "bound"
          ? `<span>access token</span><i>${KEY}</i>`
          : "<span>access token</span>";
    return node;
  };
  const verdict = (text, ok, x, y) =>
    at(
      make(
        "div",
        `verdict ${ok === null ? "open" : ok ? "ok" : "no"}`,
        stage,
        text,
      ),
      x,
      y,
    );

  // ---------- which way, and then what is sent ----------
  /**
   * Which way the next thing goes, said before it moves: the line between
   * two parties is drawn over in the sender's color, from the sender to an
   * arrowhead at the receiver. It stays until `until`.
   */
  const aim = (x1, x2, y, role, t, until) => {
    const dir = Math.sign(x2 - x1);
    const length = Math.abs(x2 - x1) - 16;
    const way = svg(
      "line",
      {
        class: `aim role-${role}`,
        x1,
        x2: x2 - dir * 16,
        y1: y,
        y2: y,
        "stroke-dasharray": length,
        "stroke-dashoffset": length,
      },
      lines,
    );
    way.drawTo = (p) => way.setAttribute("stroke-dashoffset", length * (1 - p));
    from(way, "opacity", 1);
    const tip = svg(
      "polygon",
      {
        class: `aim-head role-${role}`,
        points: `${x2},${y} ${x2 - dir * 20},${y - 11} ${x2 - dir * 20},${y + 11}`,
      },
      lines,
    );
    to(way, "draw", t, 0.55, 1, "out");
    show(tip, t + 0.4, 0.15);
    hide(way, until, 0.25);
    hide(tip, until, 0.25);
    return t + 0.55;
  };

  /**
   * What a message carries, at height `y`, from `x1` to `x2`: a token, a
   * proof, an answer, each a small labelled thing, behind the number of the
   * step that sends it. It is the only thing on this stage that moves.
   */
  const cargo = (kinds, x1, x2, y, number, role) => {
    const node = at(make("div", "cargo"), 0, y);
    let width = 10 * (kinds.length - 1);
    if (number) {
      make("b", `badge inline role-${role}`, node, String(number));
      width += 46 + 10;
    }
    for (const kind of kinds) {
      const known = ["token", "bound", "proof", "missing"].includes(kind);
      const words =
        kind === "bound" ? "token" : kind === "missing" ? "no proof" : kind;
      const pill = make(
        "span",
        `sent sent-${known ? kind : /^2\d\d\b/.test(kind) ? "ok" : "words"}`,
        node,
      );
      pill.innerHTML = `<span></span>${kind === "bound" ? `<i>${KEY}</i>` : ""}`;
      pill.firstChild.textContent = words;
      width += words.length * 12.7 + 38 + (kind === "bound" ? 44 : 0);
    }
    const dir = Math.sign(x2 - x1);
    // a thing going back to the agent leads with what it is, not with its number
    if (dir < 0) node.style.flexDirection = "row-reverse";
    const start = x1 + dir * (width / 2 + 30);
    const end = x2 - dir * (width / 2 + 30);
    node.style.left = `${start}px`;
    node.left = start;
    node.top = y;
    /**
     * It is at the sender from `wait` seconds before second `t`, leaves then,
     * and is at the receiver `dur` seconds later. On the way it is lifted
     * off the line, which a stage with depth shows as a shadow under it.
     */
    node.travel = (t, dur = 1.4, wait = 0.25) => {
      pop(node, t - wait);
      to(node, "lift", t - 0.15, 0.3, 1);
      to(node, "x", t, dur, end - start, "travel");
      to(node, "lift", t + dur - 0.3, 0.4, 0);
      return t + dur;
    };
    return node;
  };

  /** What one party does by itself: its words beside the party, behind the step's number. */
  const act = (step, n, p, y, t) => {
    const mine = p === me;
    const node = make("div", `act role-${p.role}${mine ? "" : " from-right"}`);
    node.style.top = `${y}px`;
    if (mine) node.style.left = `${LEFT + 40}px`;
    else node.style.right = `${1920 - NEAR + 20}px`;
    make("b", `badge inline role-${p.role}`, node, String(n));
    make("span", "", node, step.label);
    pop(node, t + 0.2);
    return node;
  };

  /** Lines out of a step's listing. A line with a time is marked then, and until the next one is. */
  const card = (step, picks, x, top, t, until) => {
    const source = step.code.text.split("\n");
    const node = make("div", "card");
    node.style.left = `${x}px`;
    node.style.top = `${top}px`;
    const marks = [];
    for (const pick of picks) {
      const found = source.find((line) => line.includes(pick.line));
      if (found === undefined)
        throw new Error(`Step listing has no line with ${pick.line}`);
      const text = found.trim();
      const line = make("div", "code", node);
      const mark = make("i", "", line);
      make("span", "", line, text.length > 46 ? `${text.slice(0, 45)}…` : text);
      if (pick.at !== undefined) marks.push({ mark, at: pick.at });
    }
    to(node, "y", t + 0.5, 0.001, 14);
    to(node, "y", t + 0.5, 0.4, 0, "out");
    show(node, t + 0.5, 0.4);
    marks.sort((a, b) => a.at - b.at);
    for (const [i, { mark, at: when }] of marks.entries()) {
      show(mark, Math.max(when, t + 0.9), 0.25);
      if (marks[i + 1]) hide(mark, marks[i + 1].at, 0.25);
    }
    hide(node, until - 0.25, 0.25);
    return { x, top, lines: picks.length };
  };
  const cardHeight = (lines) => 32 + lines * 51;
  const gloss = ({ term, note }, x, y, t, until) => {
    const node = at(make("div", "gloss"), x, y);
    make("b", "", node, term);
    make("span", "", node, note);
    pop(node, t);
    hide(node, until - 0.25, 0.25);
  };

  // ---------- what is said, and when ----------
  const said = make("div", "said", document.getElementById("stage"));
  const say = (text, t, dur) => {
    const line = make("p", "", said, text);
    show(line, t + 0.05, 0.3);
    hide(line, t + dur - 0.2, 0.2);
  };
  const when = (beat, word) => {
    const plain = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = (beat.words ?? []).find((w) =>
      plain(w.text).startsWith(plain(word)),
    );
    if (!found)
      throw new Error(`“${beat.say}” has no word that starts ${word}`);
    return beat.start + found.start;
  };
  let heading;
  const head = (t, title, eyebrow = "") => {
    if (heading) hide(heading, t, 0.3);
    heading = undefined;
    if (film.band || !title) return;
    heading = make("div", "heading", document.getElementById("stage"));
    if (eyebrow) make("small", "", heading, eyebrow);
    make("strong", "", heading, title);
    show(heading, t + 0.2, 0.4);
  };

  // ---------- how far the flow has got ----------
  // The steps have no place on this stage, so their numbers are kept in a
  // strip over it: the one being told in its party's color, those told
  // filled in, those to come as outlines.
  const strip = make("div", "strip");
  const dots = flow.steps.map((step, i) => {
    const pip = make("b", "pip", strip, String(i + 1));
    const dot = make(
      "i",
      `now role-${party(step.from).role}`,
      pip,
      String(i + 1),
    );
    const told = make("i", "told", pip, String(i + 1));
    return { dot, told };
  });

  // ---------- what there is on the stage ----------
  const plain = chip("token", me.x, SLOT[0]);
  const key = chip("key", me.x, SLOT[0]);
  const bound = chip("bound", me.x, SLOT[1]);
  const keystore = at(
    make("div", "keystore", stage, "keystore"),
    me.x,
    KEYSTORE_Y + 12,
  );
  const other = at(make("div", "party other"), OTHER.x, OTHER.y);
  make("strong", "", other, "Someone else");
  const ABOVE = OTHER.y - 92;
  const places = ["tool call", "log", "trace"].map((name, i) =>
    at(make("div", "place", stage, name), 680 + i * 245, TWO - 54),
  );
  const copy = chip("token", 925, TWO);
  const copyBound = chip("bound", OTHER.x, ABOVE);
  /**
   * Someone else's own way to the API: along under the agent's line and up
   * to the API from below. What they send travels along the level part.
   */
  const BEND = NEAR + 100;
  const attempt = (carries) => {
    const length =
      BEND - (OTHER.x + OTHER.w / 2) + (OTHER.y - (TWO + RIGHT.h / 2) - 16);
    const path = svg(
      "path",
      {
        class: "channel other",
        d: `M${OTHER.x + OTHER.w / 2} ${OTHER.y}H${BEND}V${TWO + RIGHT.h / 2 + 16}`,
        "stroke-dasharray": length,
        "stroke-dashoffset": length,
      },
      lines,
    );
    path.drawTo = (p) =>
      path.setAttribute("stroke-dashoffset", length * (1 - p));
    from(path, "opacity", 1);
    const bottom = TWO + RIGHT.h / 2;
    const tip = svg(
      "polygon",
      {
        class: "aim-head other",
        points: `${BEND},${bottom} ${BEND - 11},${bottom + 20} ${BEND + 11},${bottom + 20}`,
      },
      lines,
    );
    // their line is drawn first, to its arrowhead at the API, and then what they send goes along it
    const send = (t) => {
      to(path, "draw", t, 0.8, 1);
      show(tip, t + 0.7, 0.15);
      const sent = cargo(carries, OTHER.x + OTHER.w / 2, BEND, OTHER.y);
      return { arrived: sent.travel(t + 0.9, 1.1, 0.7), sent };
    };
    return { path, tip, send };
  };
  const ANSWER = {
    x: RIGHT.x + 100,
    under: TWO + RIGHT.h / 2 + 48,
    over: TWO - RIGHT.h / 2 - 44,
  };
  const watchKey = chip("key", MIDDLE - 225, me.y);
  const watchToken = chip("token", MIDDLE + 225, me.y);
  watchKey.classList.add("large");
  watchToken.classList.add("large");
  const curtain = make("div", "curtain");
  const titleCard = make("div", "title-card");
  make("h1", "", titleCard, flow.short);
  make("p", "", titleCard, flow.title.replace(` (${flow.short})`, ""));
  const close = make("div", "curtain close");
  const endCard = make("div", "title-card end-card");
  make("h1", "", endCard, "Who’s on First");
  make("p", "address", endCard, film.address);
  make("p", "basis", endCard, film.basis);

  let passing = [];
  const clear = (t, dur = 0.35) => {
    for (const node of passing) hide(node, t, dur);
    passing = [];
  };

  // the film opens with the agent, the API and the token the agent holds
  for (const p of parties) {
    const level = others.includes(p.id) ? 0 : 1;
    from(p.box, "opacity", level);
    if (p.line) from(p.line, "opacity", level);
  }
  from(plain, "opacity", 1);
  const level = (t, dur, dy) => {
    to(api.box, "y", t, dur, dy);
    to(api.line, "y", t, dur, dy);
  };
  from(api.box, "y", TWO - api.y);
  from(api.line, "y", TWO - api.y);
  const opening = beats.find((b) => b.head);
  if (opening && beats.indexOf(opening) === 0) {
    head(0, opening.head);
    if (heading) from(heading, "opacity", 1);
  }
  let part = -1;
  /** The last second at which a step is still being told. */
  const toldUntil = (n) => {
    const last = beats.findLast((b) => b.step === n);
    return last ? last.start + last.dur : undefined;
  };

  let told;
  for (const [index, beat] of beats.entries()) {
    const { start: t, dur } = beat;
    if (beat.say && film.band) say(beat.say, t, dur);
    if (beat.head && index > 0) head(t, beat.head);
    else if (beat.scene === "title" || beat.scene === "end") head(t);

    if (beat.scene === "ask") {
      show(other, t + 0.2, 0.4);
      const askCopy = chip("token", OTHER.x, ABOVE);
      pop(askCopy, when(beat, "copies"));
      const asked = attempt(["token"]);
      const { arrived, sent } = asked.send(when(beat, "Can") - 0.7);
      const mark = verdict("?", null, ANSWER.x, ANSWER.under);
      pop(mark, Math.max(arrived, when(beat, "use")));
      passing = [other, askCopy, asked.path, asked.tip, sent, mark];
    } else if (beat.scene === "spend") {
      clear(t);
      const sent = cargo(["token"], LEFT, NEAR, TWO);
      const aimed = aim(LEFT, NEAR, TWO, me.role, t + 0.3, t + dur - 0.3);
      const arrived = sent.travel(aimed + 0.1, 1.4, 0.6);
      const ok = verdict("200 OK", true, ANSWER.x, ANSWER.over);
      pop(ok, Math.max(arrived, when(beat, "spend")));
      passing = [sent, ok];
    } else if (beat.scene === "copy") {
      // the places a token passes through are along the line it travels
      const named = ["tool", "logs", "traces"];
      for (const [i, place] of places.entries())
        show(place, when(beat, named[i]) - 0.1, 0.3);
      // and a copy of it is left in one of them
      show(copy, when(beat, "logs") + 0.3, 0.3);
      to(copy, "y", when(beat, "logs") + 0.4, 0.6, ABOVE - TWO, "out");
      passing.push(copy, ...places);
    } else if (beat.scene === "steal") {
      show(other, t, 0.4);
      to(copy, "x", t + 0.2, 0.7, OTHER.x - 925);
      const taken = attempt(["token"]);
      const { arrived, sent } = taken.send(t + 1.0);
      const ok = verdict("200 OK", true, ANSWER.x, ANSWER.under);
      pop(ok, Math.max(arrived, when(beat, "works")));
      passing.push(other, taken.path, taken.tip, sent, ok);
    } else if (beat.scene === "title") {
      show(curtain, t, 0.5);
      show(titleCard, t + 0.3, 0.5);
      const reset = t + 1;
      passing.push(plain);
      clear(reset, 0.01);
      light(reset, []);
      // behind the title, the API goes to its place for the flow
      level(reset, 0.001, 0);
      hide(titleCard, t + dur - 0.5, 0.4);
      hide(curtain, t + dur - 0.4, 0.4);
    } else if (beat.scene === "cast") {
      const names = { agent: "agent", authz: "authorization", resource: "API" };
      const lit = [];
      for (const p of flow.participants.map((q) => party(q.id))) {
        lit.push(p.id);
        light(when(beat, names[p.role] ?? p.label.split(" ")[0]) - 0.1, [
          ...lit,
        ]);
      }
      pop(watchKey, when(beat, "key"));
      pop(watchToken, when(beat, "token"));
      passing = [watchKey, watchToken];
    } else if (beat.step) {
      const n = beat.step;
      const step = flow.steps[n - 1];
      const sender = party(step.from);
      const receiver = step.to ? party(step.to) : null;
      const first = beats[index - 1]?.step !== n;
      const phase = flow.phases.findLastIndex((p) => p.from <= n);
      if (first && phase !== part) {
        part = phase;
        if (phase >= 0)
          head(
            t,
            flow.phases[phase].title,
            `Part ${phase + 1} of ${flow.phases.length}`,
          );
      }
      if (first) {
        clear(t);
        const until = toldUntil(n);
        light(t, [sender.id, ...(receiver ? [receiver.id] : [])]);
        // the strip: this step is the one being told, and the one before it has been
        if (n === 1) show(strip, t, 0.4);
        show(dots[n - 1].dot, t, 0.3);
        if (n > 1) show(dots[n - 2].told, t, 0.3);
        told = { until, far: receiver && receiver !== me ? receiver : sender };
        if (receiver) {
          const out = sender === me;
          const y = told.far.y;
          const sent = cargo(
            beat.carries ?? [step.label],
            out ? LEFT : NEAR,
            out ? NEAR : LEFT,
            y,
            n,
            sender.role,
          );
          told.sent = sent;
          // What was sent is gone once the step has been told. Unless the
          // receiver keeps it, or the next step is the receiver checking it:
          // then it waits where it stopped until it has been checked.
          const kept = beats.some(
            (b) =>
              b.step === n &&
              b.gain &&
              (step.gain ?? []).some(([, what]) =>
                what.startsWith("access token"),
              ),
          );
          const next = flow.steps[n];
          const checked = next && !next.to && next.from === receiver.id;
          const gone = (checked ? toldUntil(n + 1) : until) - 0.3;
          // first which way, and then what is sent
          const aimed = aim(
            out ? LEFT : NEAR,
            out ? NEAR : LEFT,
            y,
            sender.role,
            t + 0.3,
            gone,
          );
          sent.travel(aimed + 0.1, 1.4, 0.6);
          if (!kept) hide(sent, gone, 0.25);
        } else {
          // what one party does by itself: beside the agent, or beside what the other party was sent
          told.act = act(
            step,
            n,
            sender,
            sender === me
              ? beats.some((b) => b.step === n && b.show)
                ? 300
                : me.y
              : sender.y - 76,
            t,
          );
          hide(told.act, until - 0.3, 0.25);
        }
      }
      if (beat.show) {
        const height = cardHeight(beat.show.length);
        // under the upper line, over the lower one, and under what the agent does by itself
        const top = !receiver
          ? 352
          : told.far.y < me.y
            ? told.far.y + 62
            : told.far.y - 62 - height;
        told.card = card(
          step,
          beat.show.map((pick) => ({
            ...pick,
            at: pick.on ? when(beat, pick.on) : undefined,
          })),
          receiver ? MIDDLE : LEFT + 40 + 450,
          top,
          t,
          told.until,
        );
      }
      if (beat.gain)
        for (const [, what] of step.gain ?? []) {
          if (what.startsWith("private key")) pop(key, when(beat, beat.gain));
          else if (what.startsWith("access token")) {
            const held = when(beat, beat.gain);
            const arrived = told.sent;
            if (arrived) {
              to(arrived, "x", held - 0.5, 0.5, me.x - arrived.left);
              to(arrived, "y", held - 0.5, 0.5, SLOT[1] - arrived.top);
              hide(arrived, held - 0.05, 0.1);
            }
            pop(bound, held);
          }
        }
      if (beat.gloss)
        gloss(
          beat.gloss,
          told.card?.x ?? MIDDLE,
          told.card
            ? told.card.top + cardHeight(told.card.lines) + 46
            : me.y + 90,
          when(beat, beat.gloss.on),
          told.until,
        );
      if (beat.check) {
        const tick = make("em", "tick", told.act, "✓");
        pop(tick, when(beat, beat.check));
      }
    } else if (beat.scene === "refuse") {
      light(t, [api.id], others);
      hide(strip, t, 0.4);
      // the authorization server has gone, and the API comes level with the agent again
      level(t, 0.7, TWO - api.y);
      show(other, t + 0.2, 0.4);
      pop(copyBound, when(beat, "copy"));
      const tried = attempt(["bound", "missing"]);
      const { arrived, sent } = tried.send(when(beat, "Without"));
      const no = verdict("Refused: no proof", false, ANSWER.x, ANSWER.under);
      pop(no, Math.max(arrived, when(beat, "refuses")));
      passing = [other, copyBound, tried.path, tried.tip, sent, no];
    } else if (beat.scene === "caveat") {
      clear(t, 0.4);
      light(t, [me.id], others);
      // the key leaves the token's side for a place of its own, lower in the agent
      show(keystore, when(beat, "keep") - 0.2, 0.4);
      to(key, "y", when(beat, "keep"), 0.8, KEYSTORE_Y - SLOT[0]);
      to(bound, "y", when(beat, "keep"), 0.8, SLOT[0] - SLOT[1]);
    } else if (beat.scene === "end") {
      show(close, t, 0.5);
      show(endCard, t + 0.3, 0.5);
    }
  }

  // ---------- one frame ----------
  for (const track of tracks) track.keys.sort((a, b) => a.t - b.t);
  const nodes = [...new Set(tracks.map((t) => t.node))];
  window.seek = (t) => {
    const now = new Map(nodes.map((node) => [node, {}]));
    for (const track of tracks)
      now.get(track.node)[track.prop] = valueAt(track, t);
    let signature = "";
    for (const [node, v] of now) {
      if (v.draw !== undefined) node.drawTo(v.draw);
      if (v.opacity !== undefined) node.style.opacity = v.opacity.toFixed(3);
      if (v.lift !== undefined)
        node.style.setProperty("--lift", v.lift.toFixed(3));
      if (v.x !== undefined || v.y !== undefined || v.scale !== undefined)
        node.style.setProperty(
          "--move",
          `translate(${(v.x ?? 0).toFixed(1)}px, ${(v.y ?? 0).toFixed(1)}px) scale(${(v.scale ?? 1).toFixed(3)})`,
        );
      signature += Object.values(v)
        .map((n) => n.toFixed(3))
        .join(",");
      signature += ";";
    }
    return signature;
  };
  window.seek(0);
})();
