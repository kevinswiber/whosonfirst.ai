/**
 * The stage for a flow's film on which the parties stay where they are. This
 * file runs in the page that scripts/flow-film.mjs opens with
 * `--layout fixed`, not in Node. docs/film-design.md has its measurements.
 *
 * One party stands at the left, as tall as the stage, with what it holds
 * inside it: the one that speaks to the most others, and the agent where
 * that is a tie. The others stand at the right, one above another. A line
 * runs between each two parties that speak to each other: level, from the
 * tall party to each of the others, and upright between two at the right.
 * The only thing that moves is what is sent, and before it moves its line
 * is drawn over toward whoever will receive it.
 *
 * There are no rows, so the order of the steps is not on the stage as a
 * place. Each thing sent carries its step's number, and a strip of numbers
 * says how far the flow has got.
 *
 * It takes the same `window.FILM` as scripts/film-stage.js and gives the
 * same `window.seek(t)`. The part that places things in time is the same as
 * that stage's, copied: a fix to it goes in both.
 */
(() => {
  const film = window.FILM;
  const { flow, beats } = film;
  const stage = document.getElementById("scene");
  const DIM = 0.3;

  // ---------- who stands where, in a stage of 1920 by 1080 ----------
  /** Who each party speaks to. */
  const speaks = new Map(flow.participants.map((p) => [p.id, new Set()]));
  for (const step of flow.steps)
    if (step.to) {
      speaks.get(step.from).add(step.to);
      speaks.get(step.to).add(step.from);
    }
  const linked = (a, b) => speaks.get(a.id).has(b.id);
  const placeOf = (p) => flow.participants.findIndex((q) => q.id === p.id);
  /** The tall party: whoever speaks to the most others. An agent before another, and a person last. */
  const [tall, ...others] = [...flow.participants].sort(
    (a, b) =>
      speaks.get(b.id).size - speaks.get(a.id).size ||
      (b.role === "agent") - (a.role === "agent") ||
      (a.role === "human") - (b.role === "human") ||
      placeOf(a) - placeOf(b),
  );
  if (others.length > 3)
    throw new Error(
      `The fixed layout has places for four parties, and ${flow.slug} has ${flow.participants.length}`,
    );
  /**
   * The others, top to bottom: in the page's order, unless two of them speak
   * to each other. Those two are put next to each other, since their line is
   * the gap between them.
   */
  const orders = (list) =>
    list.length < 2
      ? [list]
      : list.flatMap((first) =>
          orders(list.filter((p) => p !== first)).map((rest) => [
            first,
            ...rest,
          ]),
        );
  const cost = (order) => {
    let apart = 0;
    let moved = 0;
    for (let i = 0; i < order.length; i++)
      for (let j = i + 1; j < order.length; j++) {
        if (j - i > 1 && linked(order[i], order[j])) apart++;
        if (placeOf(order[i]) > placeOf(order[j])) moved++;
      }
    return apart * 100 + moved;
  };
  const stacked = orders(others).sort((a, b) => cost(a) - cost(b))[0];
  if (cost(stacked) >= 100)
    throw new Error(
      `The fixed layout cannot draw ${flow.slug}: three of its parties at the right all speak to each other, and only neighbours have a line between them`,
    );

  /**
   * The tall party's box. It starts the same way under the strip of numbers
   * whatever the flow, and is taller where three parties stand beside it:
   * down to where, in a silent cut, the sentence is written.
   */
  const BOX =
    stacked.length > 2
      ? { x: 310, w: 360, top: 190, h: 590 }
      : { x: 310, w: 360, top: 190, h: 480 };
  const LEFT = BOX.x + BOX.w / 2; // where its lines leave it
  const MID = BOX.top + BOX.h / 2;
  /** The other parties: boxes at the right. */
  const RIGHT = { x: 1580, w: 380, h: 104 };
  const NEAR = RIGHT.x - RIGHT.w / 2; // where a level line reaches one
  /** Between the tall party and the others: where a listing is shown. */
  const MIDDLE = (LEFT + NEAR) / 2;
  /** How wide a listing is, and how many letters of a line it has room for. */
  const CARD = { w: 820, letters: 42 };
  /** What the tall party holds: the first thing here, and each next one this far under it. */
  const SLOT = { first: BOX.top + 140, step: 70 };
  const SLOTS = Math.floor((BOX.h - 140 - 40) / SLOT.step) + 1;
  const KEYSTORE_Y = BOX.top + 374;
  /** Where someone else stands, when someone else has a copy of the token. */
  const OTHER = { x: 720, y: 742, w: 400 };

  // Down the right: the gaps share what room there is, and a gap that has a
  // line in it has three times the room of one that has none.
  const span = [BOX.top + 8, BOX.top + BOX.h + 2];
  const free = span[1] - span[0] - stacked.length * RIGHT.h;
  const weights = stacked
    .slice(1)
    .map((p, i) => (linked(stacked[i], p) ? 3 : 1));
  const whole = weights.reduce((sum, w) => sum + w, 0);
  let down = span[0];
  const parties = [
    { ...tall, x: BOX.x, y: MID },
    ...stacked.map((p, i) => {
      const y = stacked.length === 1 ? MID : down + RIGHT.h / 2;
      down += RIGHT.h + (free * (weights[i] ?? 0)) / (whole || 1);
      return { ...p, x: RIGHT.x, y };
    }),
  ];
  const party = (id) => parties.find((p) => p.id === id);
  const hub = parties[0];
  /** Who holds something at some point in the flow: a thing held hangs from a party at the right. */
  const holders = new Set(
    flow.steps.flatMap((s) => (s.gain ?? []).map(([id]) => id)),
  );

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
  const START = {
    opacity: 0,
    x: 0,
    y: 0,
    scale: 1,
    draw: 0,
    dim: 0,
    lift: 0,
  };
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

  // ---------- the parties, and a line between each two that speak ----------
  const lines = svg(
    "svg",
    { class: "lines", width: 1920, height: 1080 },
    stage,
  );
  hub.box = at(make("div", `party tall role-${hub.role}`), hub.x, hub.y);
  hub.box.style.width = `${BOX.w}px`;
  hub.box.style.height = `${BOX.h}px`;
  make("strong", "", hub.box, hub.label);
  for (const p of parties.slice(1)) {
    p.box = at(make("div", `party role-${p.role}`), p.x, p.y);
    p.box.style.width = `${RIGHT.w}px`;
    make("strong", "", p.box, p.label);
    // a party that will hold something has its name a little higher, clear of what hangs from it
    if (holders.has(p.id)) p.box.style.paddingBottom = "26px";
  }
  /**
   * Where a line between two parties leaves the first and reaches the
   * second. Level between the tall party and another, at the other's height.
   * Upright between two at the right, from under the upper one, and from
   * under what hangs from it if anything does.
   */
  const ends = (a, b) => {
    if (a === hub)
      return [
        { x: LEFT, y: b.y },
        { x: NEAR, y: b.y },
      ];
    if (b === hub) return ends(b, a).reverse();
    const [upper, lower] = a.y < b.y ? [a, b] : [b, a];
    const top = upper.y + RIGHT.h / 2 + (holders.has(upper.id) ? 30 : 0);
    const run = [
      { x: RIGHT.x, y: top },
      { x: RIGHT.x, y: lower.y - RIGHT.h / 2 },
    ];
    return a === upper ? run : run.reverse();
  };
  const links = [];
  for (const [i, a] of parties.entries())
    for (const b of parties.slice(i + 1))
      if (linked(a, b)) {
        const [p, q] = ends(a, b);
        links.push({
          a,
          b,
          line: svg(
            "line",
            { class: "channel", x1: p.x, y1: p.y, x2: q.x, y2: q.y },
            lines,
          ),
        });
      }
  const linkOf = (a, b) =>
    links.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  /**
   * Who is taking part: the others are dimmed, and one named in `gone` is not
   * there at all. A line is lit when the parties at both its ends are. With
   * `first`, this is how the film opens, and nothing fades to it.
   */
  const light = (t, ids, gone = [], first = false) => {
    const level = (p) =>
      gone.includes(p.id) ? 0 : ids.includes(p.id) ? 1 : DIM;
    const set = (node, value) =>
      first ? from(node, "opacity", value) : to(node, "opacity", t, 0.4, value);
    for (const p of parties) set(p.box, level(p));
    for (const { a, b, line } of links) {
      const both = Math.min(level(a), level(b));
      set(line, both === 0 ? 0 : both === 1 ? 1 : DIM);
    }
  };

  const KEY =
    '<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.5"/><path d="M12.5 12H22M18 12v4M21.5 12v3"/></svg>';
  /**
   * A thing held: a key, a token, or a token bound to a key. It is given
   * its own words where it has them, in smaller letters if they are long,
   * and cut short if they are longer than its party has room for.
   */
  const chip = (kind, x, y, words) => {
    const node = at(make("div", `held held-${kind}`), x, y);
    node.innerHTML =
      kind === "key"
        ? `${KEY}<span></span>`
        : kind === "bound"
          ? `<span></span><i>${KEY}</i>`
          : "<span></span>";
    const label = node.querySelector("span");
    if (!words) {
      label.textContent = kind === "key" ? "private key" : "access token";
      return node;
    }
    const extra = kind === "token" ? 0 : 40;
    const room = 324 - 44 - extra;
    const small = words.length * 14.4 > room;
    const each = small ? 12 : 14.4;
    const most = Math.floor(room / each);
    const text = words.length > most ? `${words.slice(0, most - 1)}…` : words;
    label.textContent = text;
    if (small) node.style.fontSize = "20px";
    node.style.width = `${Math.max(280, Math.ceil(text.length * each) + 44 + extra)}px`;
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

  // ---------- what a party holds ----------
  const held = new Map(parties.map((p) => [p, []]));
  /**
   * A party comes to hold something at second `t`. In the tall party it
   * takes the next place down, and when there is no place left the oldest
   * goes and the rest move up. From a party at the right it hangs under the
   * box, and takes the place of what hung there. `arrived` is what was sent,
   * if this is it: it goes to where the thing is held, or is gone when it is.
   */
  const hold = (p, what, t, arrived) => {
    const words = what.replace(/\s*\(.*\)\s*$/, "");
    const kind = /\bkey\b/i.test(words)
      ? "key"
      : /\bbound\b/i.test(what)
        ? "bound"
        : "token";
    const mine = held.get(p);
    let y = p.y + RIGHT.h / 2;
    if (p === hub) {
      if (mine.length === SLOTS) {
        hide(mine.shift().node, t - 0.4, 0.3);
        for (const thing of mine) {
          thing.dy -= SLOT.step;
          to(thing.node, "y", t - 0.4, 0.3, thing.dy);
        }
      }
      y = SLOT.first + mine.length * SLOT.step;
    } else for (const thing of mine.splice(0)) hide(thing.node, t - 0.1, 0.2);
    const thing = {
      node: chip(kind, p.x, y, words),
      kind,
      what,
      words,
      y,
      dy: 0,
    };
    mine.push(thing);
    if (arrived && p === hub) {
      to(arrived, "x", t - 0.5, 0.5, p.x - arrived.left);
      to(arrived, "y", t - 0.5, 0.5, y - arrived.top);
      hide(arrived, t - 0.05, 0.1);
    } else if (arrived) hide(arrived, t - 0.1, 0.2);
    pop(thing.node, t);
    return thing;
  };

  /**
   * A party stops holding something at second `t`, as the page says it does:
   * a code that has been redeemed, a key that was only held for one request.
   * It goes, and in the tall party what is under it moves up.
   */
  const drop = (p, what, t) => {
    const mine = held.get(p);
    const words = what.replace(/\s*\(.*\)\s*$/, "");
    const exact = mine.findIndex((thing) => thing.what === what);
    const found =
      exact >= 0 ? exact : mine.findIndex((thing) => thing.words === words);
    if (found < 0) return;
    const [gone] = mine.splice(found, 1);
    hide(gone.node, t, 0.3);
    if (p === hub)
      for (const thing of mine.slice(found)) {
        thing.dy -= SLOT.step;
        to(thing.node, "y", t + 0.2, 0.3, thing.dy);
      }
  };

  // ---------- which way, and then what is sent ----------
  /**
   * Which way the next thing goes, said before it moves: the line from `a`
   * to `b` is drawn over in the sender's color, to an arrowhead at `b`. It
   * stays until `until`.
   */
  const aim = (a, b, role, t, until) => {
    const far = Math.hypot(b.x - a.x, b.y - a.y);
    const [ux, uy] = [(b.x - a.x) / far, (b.y - a.y) / far];
    const length = far - 16;
    const way = svg(
      "line",
      {
        class: `aim role-${role}`,
        x1: a.x,
        y1: a.y,
        x2: b.x - ux * 16,
        y2: b.y - uy * 16,
        "stroke-dasharray": length,
        "stroke-dashoffset": length,
      },
      lines,
    );
    way.drawTo = (p) => way.setAttribute("stroke-dashoffset", length * (1 - p));
    from(way, "opacity", 1);
    const back = { x: b.x - ux * 20, y: b.y - uy * 20 };
    const tip = svg(
      "polygon",
      {
        class: `aim-head role-${role}`,
        points: `${b.x},${b.y} ${back.x - uy * 11},${back.y + ux * 11} ${back.x + uy * 11},${back.y - ux * 11}`,
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
   * What a message carries, from the point `a` to the point `b`: a token, a
   * proof, an answer, each a small labelled thing, behind the number of the
   * step that sends it. It is the only thing on this stage that moves. Along
   * a level line it stops short of each end by its own half width, and along
   * an upright one by its half height.
   */
  const cargo = (kinds, a, b, number, role) => {
    const node = make("div", "cargo");
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
      // its width is reckoned, since the page's type may not be loaded yet
      width += words.length * 12.7 + 38 + (kind === "bound" ? 44 : 0);
    }
    const level = a.y === b.y;
    const dir = Math.sign(level ? b.x - a.x : b.y - a.y);
    // a thing going back to the left leads with what it is, not with its number
    if (level && dir < 0) node.style.flexDirection = "row-reverse";
    const start = level
      ? { x: a.x + dir * (width / 2 + 30), y: a.y }
      : { x: a.x, y: a.y + dir * (23 + 14) };
    const end = level
      ? { x: b.x - dir * (width / 2 + 30), y: b.y }
      : { x: b.x, y: b.y - dir * (23 + 30) };
    at(node, start.x, start.y);
    node.left = start.x;
    node.top = start.y;
    /**
     * It is at the sender from `wait` seconds before second `t`, leaves then,
     * and is at the receiver `dur` seconds later. On the way it is lifted
     * off the line, which a stage with depth shows as a shadow under it.
     */
    node.travel = (t, dur = 1.4, wait = 0.25) => {
      pop(node, t - wait);
      to(node, "lift", t - 0.15, 0.3, 1);
      if (level) to(node, "x", t, dur, end.x - start.x, "travel");
      else to(node, "y", t, dur, end.y - start.y, "travel");
      to(node, "lift", t + dur - 0.3, 0.4, 0);
      return t + dur;
    };
    return node;
  };

  /** What one party does by itself: its words beside the party, behind the step's number. */
  const act = (step, n, p, y, t) => {
    const node = make("div", `act role-${p.role}`);
    node.style.top = `${y}px`;
    if (p === hub) node.style.left = `${LEFT + 40}px`;
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
      make(
        "span",
        "",
        line,
        text.length > CARD.letters
          ? `${text.slice(0, CARD.letters - 1)}…`
          : text,
      );
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
  const cardHeight = (count) => 32 + count * 51;
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
  /** The second a cue is due: at its word, or at `otherwise` where a draft names no word. */
  const due = (beat, word, otherwise) =>
    typeof word === "string" ? when(beat, word) : otherwise;
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
  let stripShown = false;
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

  // ---------- what the film of DPoP has before its flow and after it ----------
  // A film's opening and ending are its own, and these are DPoP's: a token
  // spent, a copy of it left in a log, someone else trying the copy, the copy
  // refused, the key put away. They want an agent that is the tall party and
  // an API, and a film that opens with the scene `ask`.
  const api = parties.find((p) => p.role === "resource");
  const story = beats[0]?.scene === "ask";
  if (story && (hub.role !== "agent" || !api))
    throw new Error(
      `The scenes before ${flow.slug}'s steps are written for an agent that speaks to every party, and an API`,
    );
  const fromStory = (scene) => {
    if (!story)
      throw new Error(
        `The scene ${scene} belongs to a film that opens with the scene ask`,
      );
  };
  /**
   * While only the agent and the API take part, before the flow and after
   * it, the API stands level with the middle of the agent, and the line
   * between them is at that height. For the flow it is in its place below.
   */
  const TWO = MID;
  const plain = chip("token", hub.x, SLOT.first);
  const keystore = at(
    make("div", "keystore", stage, "keystore"),
    hub.x,
    KEYSTORE_Y + 14,
  );
  const other = at(make("div", "party other"), OTHER.x, OTHER.y);
  make("strong", "", other, "Someone else");
  const ABOVE = OTHER.y - 108;
  const places = ["tool call", "log", "trace"].map((name, i) =>
    at(make("div", "place", stage, name), 680 + i * 245, TWO - 54),
  );
  const copy = chip("token", 925, TWO);
  const copyBound = chip("bound", OTHER.x, ABOVE);
  /**
   * Someone else's own way to the API: along under the agent's line and up
   * to the API from below. What they send travels along the level part.
   */
  const BEND = NEAR + 60;
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
      const sent = cargo(
        carries,
        { x: OTHER.x + OTHER.w / 2, y: OTHER.y },
        { x: BEND, y: OTHER.y },
      );
      return { arrived: sent.travel(t + 0.9, 1.1, 0.7), sent };
    };
    return { path, tip, send };
  };
  const ANSWER = {
    // its widest, “Refused: no proof”, ends at the safe edge
    x: RIGHT.x + 75,
    under: TWO + RIGHT.h / 2 + 66,
    over: TWO - RIGHT.h / 2 - 66,
  };
  const watchKey = chip("key", MIDDLE - 225, MID);
  const watchToken = chip("token", MIDDLE + 225, MID);
  watchKey.classList.add("large");
  watchToken.classList.add("large");

  // ---------- the cards ----------
  const curtain = make("div", "curtain");
  const titleCard = make("div", "title-card");
  make("h1", "", titleCard, flow.short);
  // what the short name stands for, where the film's script gives it
  const expands = beats.find((b) => b.scene === "title")?.expands;
  if (expands) make("p", "expands", titleCard, expands);
  make("p", "", titleCard, flow.title.replace(` (${flow.short})`, ""));
  const close = make("div", "curtain close");
  const endCard = make("div", "title-card end-card");
  make("h1", "", endCard, "Who’s on First");
  if (film.descriptor) make("p", "descriptor", endCard, film.descriptor);
  make("p", "address", endCard, film.address);
  if (film.standards) make("p", "standards", endCard, film.standards);

  let passing = [];
  const clear = (t, dur = 0.35) => {
    for (const node of passing) hide(node, t, dur);
    passing = [];
  };

  // DPoP's film opens with the agent, the API and the token the agent holds.
  // Any other opens with every party there, and none of them taking part yet.
  const absent = parties.filter((p) => p !== hub && p !== api).map((p) => p.id);
  const level = (t, dur, dy) => {
    to(api.box, "y", t, dur, dy);
    to(linkOf(hub, api).line, "y", t, dur, dy);
  };
  if (story) {
    light(0, [hub.id, api.id], absent, true);
    from(plain, "opacity", 1);
    from(api.box, "y", TWO - api.y);
    from(linkOf(hub, api).line, "y", TWO - api.y);
  } else light(0, [], [], true);
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
      fromStory(beat.scene);
      clear(t);
      const [a, b] = [
        { x: LEFT, y: TWO },
        { x: NEAR, y: TWO },
      ];
      const sent = cargo(["token"], a, b);
      const aimed = aim(a, b, hub.role, t + 0.3, t + dur - 0.3);
      const arrived = sent.travel(aimed + 0.1, 1.4, 0.6);
      const ok = verdict("200 OK", true, ANSWER.x, ANSWER.over);
      pop(ok, Math.max(arrived, when(beat, "spend")));
      passing = [sent, ok];
    } else if (beat.scene === "copy") {
      fromStory(beat.scene);
      // the places a token passes through are along the line it travels
      const named = ["tool", "logs", "traces"];
      for (const [i, place] of places.entries())
        show(place, when(beat, named[i]) - 0.1, 0.3);
      // and a copy of it is left in one of them
      show(copy, when(beat, "logs") + 0.3, 0.3);
      to(copy, "y", when(beat, "logs") + 0.4, 0.6, ABOVE - TWO, "out");
      passing.push(copy, ...places);
    } else if (beat.scene === "steal") {
      fromStory(beat.scene);
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
      if (story) passing.push(plain);
      clear(reset, 0.01);
      light(reset, []);
      // behind the title, the API goes to its place for the flow
      if (story) level(reset, 0.001, 0);
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
      const phase = (flow.phases ?? []).findLastIndex((p) => p.from <= n);
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
        if (!stripShown) show(strip, t, 0.4);
        stripShown = true;
        show(dots[n - 1].dot, t, 0.3);
        if (n > 1) show(dots[n - 2].told, t, 0.3);
        told = { until, sender, receiver };
        if (receiver) {
          const [a, b] = ends(sender, receiver);
          const sent = cargo(
            beat.carries ?? [step.label],
            a,
            b,
            n,
            sender.role,
          );
          told.sent = sent;
          // What was sent is gone once the step has been told. Unless the
          // receiver keeps it, or the next step is the receiver checking it,
          // which that step's beat says with `check`: then it waits where it
          // stopped, with its line still lit, until it has been checked.
          const kept =
            beats.some((b) => b.step === n && b.gain) &&
            (step.gain ?? []).some(([id]) => id === receiver.id);
          const next = flow.steps[n];
          const checked =
            next &&
            !next.to &&
            next.from === receiver.id &&
            beats.some((b) => b.step === n + 1 && b.check);
          const gone = (checked ? toldUntil(n + 1) : until) - 0.3;
          // first which way, and then what is sent
          const aimed = aim(a, b, sender.role, t + 0.3, gone);
          told.arrives = sent.travel(aimed + 0.1, 1.4, 0.6);
          if (!kept) hide(sent, gone, 0.25);
        } else {
          // What one party does by itself is said beside it: right of the
          // tall party, and left of another, on the side of its line that
          // has more room.
          // The tall party's words and their listing are, together, level
          // with the middle of it.
          const listed = beats.find((b) => b.step === n && b.show);
          const under = listed ? cardHeight(listed.show.length) + 26 : 0;
          told.actY =
            sender === hub
              ? MID - under / 2
              : sender.y + (sender.y > MID ? -90 : 90);
          told.act = act(step, n, sender, told.actY, t);
          hide(told.act, until - 0.3, 0.25);
        }
      }
      if (beat.show) {
        const height = cardHeight(beat.show.length);
        const far = receiver === hub ? sender : receiver;
        // Beside a level line: under an upper one, over a lower one. Beside
        // an upright one: level with the middle of it. And for what a party
        // does by itself: on the far side of its words from its line.
        const top = !receiver
          ? sender === hub
            ? told.actY + 61
            : sender.y > MID
              ? told.actY - 61 - height
              : told.actY + 61
          : sender === hub || receiver === hub
            ? far.y <= MID
              ? far.y + 62
              : far.y - 62 - height
            : Math.min(
                Math.max((sender.y + receiver.y) / 2 - height / 2, BOX.top),
                BOX.top + BOX.h - height,
              );
        told.card = card(
          step,
          beat.show.map((pick) => ({
            ...pick,
            at: pick.on ? when(beat, pick.on) : undefined,
          })),
          !receiver && sender === hub ? LEFT + 40 + CARD.w / 2 : MIDDLE,
          top,
          t,
          told.until,
        );
      }
      // What the step takes from a party goes as the step begins, or at the
      // word a beat of the step names with `lose`.
      if (first)
        for (const [id, what] of step.lose ?? []) {
          const cue = beats.find(
            (b) => b.step === n && typeof b.lose === "string",
          );
          drop(party(id), what, cue ? when(cue, cue.lose) : t + 1);
        }
      if (beat.gain)
        for (const [id, what] of step.gain ?? []) {
          const sent = receiver?.id === id ? told.sent : undefined;
          hold(
            party(id),
            what,
            due(beat, beat.gain, (told.arrives ?? t + 0.9) + 0.6),
            sent,
          );
          if (sent) told.sent = undefined;
        }
      if (beat.gloss)
        gloss(
          beat.gloss,
          told.card?.x ?? MIDDLE,
          told.card
            ? told.card.top + cardHeight(told.card.lines) + 56
            : MID + 90,
          when(beat, beat.gloss.on),
          told.until,
        );
      if (beat.check) {
        const tick = make("em", "tick", told.act, "✓");
        pop(tick, when(beat, beat.check));
      }
    } else if (beat.scene === "refuse") {
      fromStory(beat.scene);
      light(t, [api.id], absent);
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
      fromStory(beat.scene);
      clear(t, 0.4);
      light(t, [hub.id], absent);
      // the key leaves the token's side for a place of its own, lower in the agent
      const key = held.get(hub).find((thing) => thing.kind === "key");
      const token = held.get(hub).find((thing) => thing.kind !== "key");
      show(keystore, when(beat, "keep") - 0.2, 0.4);
      to(key.node, "y", when(beat, "keep"), 0.8, KEYSTORE_Y - key.y);
      to(token.node, "y", when(beat, "keep"), 0.8, SLOT.first - token.y);
    } else if (beat.scene === "end") {
      if (!story) hide(strip, t, 0.4);
      show(close, t, 0.5);
      show(endCard, t + 0.3, 0.5);
      // the address is on the end card, so it goes from the corner
      const where = document.querySelector(".where");
      if (where) {
        from(where, "opacity", 1);
        hide(where, t, 0.5);
      }
    }
  }

  // ---------- one frame ----------
  // What this film never shows is not there: a thing made for a scene the
  // film does not have would otherwise sit on the stage for the whole of it.
  const shown = new Set(
    tracks.filter((t) => t.prop === "opacity").map((t) => t.node),
  );
  for (const node of [...stage.children, ...lines.children])
    if (node !== lines && !shown.has(node)) node.style.opacity = 0;
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
