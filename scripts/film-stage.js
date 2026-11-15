/**
 * The stage a flow's film is played on. This file runs in the page that
 * scripts/flow-film.mjs opens, not in Node.
 *
 * The page is given `window.FILM`: the flow, and the film's beats with the
 * second each starts and how long it lasts. From those this builds everything
 * that will ever be on the stage, and for each thing a list of where it is at
 * which second. `window.seek(t)` then puts the stage as it is at second `t`.
 * Nothing here runs on a clock: a frame is a function of its time alone, so
 * the same film comes out every time, one frame after another.
 *
 * What it keeps to, so a frame can be followed:
 *
 * - Only what has happened is on the stage. A step that has not been reached
 *   is not drawn.
 * - One thing moves at a time, and the parties that take no part in a step
 *   are dimmed while it is told.
 * - What is said is the only sentence on the stage.
 */
(() => {
  const film = window.FILM;
  const { flow, beats } = film;
  // Everything that is drawn is in the scene. What is said, when it is written
  // out, is under the scene and not in it.
  const stage = document.getElementById("scene");

  // ---------- where things are, in a stage of 1920 by 1080 ----------
  const PARTY_W = 400;
  const PARTY_H = 104;
  const PARTY_TOP = 60;
  const TRAY_Y = PARTY_TOP + PARTY_H + 38;
  const LIFE_BOTTOM = 790;
  /** The row being told, and the one before it. */
  const FOCUS_Y = 448;
  const PREV_Y = 332;
  const CARD_TOP = FOCUS_Y + 54;
  /** Where someone else stands, when someone else has a copy of the token. */
  const OTHER = { x: 960, y: 700 };
  const DIM = 0.3;

  const parties = flow.participants.map((p, i, all) => ({
    ...p,
    x: 330 + (i * 1260) / Math.max(1, all.length - 1),
  }));
  const party = (id) => parties.find((p) => p.id === id);

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
  /** A thing at a place on the stage: its middle is at (x, y) until it is moved. */
  const at = (node, x, y) => {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    return node;
  };

  // ---------- where each thing is at which second ----------
  const START = { opacity: 0, x: 0, y: 0, scale: 1, draw: 0, dim: 0 };
  const tracks = [];
  const trackOf = (node, prop) => {
    let found = tracks.find((t) => t.node === node && t.prop === prop);
    if (!found) {
      found = { node, prop, keys: [] };
      tracks.push(found);
    }
    return found;
  };
  /** From second `t`, over `dur` seconds, a thing's `prop` goes to `value`. */
  const to = (node, prop, t, dur, value, ease = "inOut") => {
    const { keys } = trackOf(node, prop);
    const before = keys.length ? keys[keys.length - 1].v : START[prop];
    keys.push(
      { t, v: before },
      { t: t + Math.max(dur, 0.001), v: value, ease },
    );
  };
  /** How a thing is before the film starts. */
  const from = (node, prop, value) => {
    trackOf(node, prop).keys.push({ t: -1, v: value });
  };
  const show = (node, t, dur = 0.35, value = 1) =>
    to(node, "opacity", t, dur, value);
  const hide = (node, t, dur = 0.3) => to(node, "opacity", t, dur, 0);
  /** A thing arrives: it is there, and a little larger for a moment. */
  const pop = (node, t) => {
    show(node, t, 0.25);
    to(node, "scale", t, 0.001, 0.8);
    to(node, "scale", t, 0.3, 1, "out");
  };

  const EASE = {
    inOut: (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
    out: (p) => 1 - (1 - p) ** 3,
    linear: (p) => p,
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

  // ---------- the parties, what each holds, and its line down the stage ----------
  const lines = svg(
    "svg",
    { class: "lines", width: 1920, height: 1080 },
    stage,
  );
  for (const p of parties) {
    p.box = at(
      make("div", `party role-${p.role}`),
      p.x,
      PARTY_TOP + PARTY_H / 2,
    );
    // What a party holds is drawn under it as it comes to hold it, so the line
    // the page writes under its name, which says so from the start, is left out.
    make("strong", "", p.box, p.label);
    p.life = svg(
      "line",
      {
        class: `life role-${p.role}`,
        x1: p.x,
        x2: p.x,
        y1: PARTY_TOP + PARTY_H,
        y2: LIFE_BOTTOM,
      },
      lines,
    );
  }
  /** Who is taking part: the others are dimmed, and one named in `gone` is not there at all. */
  const light = (t, ids, gone = []) => {
    for (const p of parties) {
      const level = gone.includes(p.id) ? 0 : ids.includes(p.id) ? 1 : DIM;
      to(p.box, "opacity", t, 0.4, level);
      to(p.life, "opacity", t, 0.4, level);
    }
  };

  const KEY =
    '<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.5"/><path d="M12.5 12H22M18 12v4M21.5 12v3"/></svg>';
  /** Something a party holds: a key, or a token, which may be bound to one. */
  const chip = (kind, x, y, role) => {
    const node = at(
      make("div", `held held-${kind}${role ? ` role-${role}` : ""}`),
      x,
      y,
    );
    node.innerHTML =
      kind === "key"
        ? `${KEY}<span>private key</span>`
        : kind === "bound"
          ? `<span>access token</span><i>${KEY}</i>`
          : "<span>access token</span>";
    return node;
  };
  /** What an API says of a request, beside the request. */
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

  // ---------- a message between two parties, or what one party does by itself ----------
  const rows = [];
  /** An arrow from one place to another along a row, with its words above it. */
  const arrow = (parent, x1, x2, label, { dashed, badge, role } = {}) => {
    const g = svg(
      "svg",
      { class: "arrow", width: 1920, height: 120, viewBox: "0 -60 1920 120" },
      parent,
    );
    const dir = Math.sign(x2 - x1);
    const from = x1 + dir * (badge ? 26 : 0);
    const line = svg(
      "line",
      { x1: from, x2: from, y1: 0, y2: 0, class: dashed ? "dashed" : "" },
      g,
    );
    const head = svg("path", { d: "M0 0l-20 -11v22z", class: "head" }, g);
    const words = make("div", "says", parent, label);
    words.style.left = `${(x1 + x2) / 2}px`;
    if (badge) {
      const dot = make("b", `badge role-${role}`, parent, String(badge));
      dot.style.left = `${x1}px`;
    }
    // how much of it is drawn, from none to all
    g.drawTo = (p) => {
      const tip = from + (x2 - dir * 4 - from) * p;
      line.setAttribute("x2", tip - dir * 16);
      head.setAttribute("transform", `translate(${tip} 0) scale(${dir} 1)`);
      head.style.opacity = p > 0.02 ? 1 : 0;
      line.style.opacity = p > 0.02 ? 1 : 0;
    };
    g.drawTo(0);
    return g;
  };
  /** A step of the flow as a row: it comes in at the focus, and moves up as the next is told. */
  const row = (step, n, t) => {
    const node = make("div", "row");
    const from = party(step.from);
    const toParty = step.to ? party(step.to) : null;
    let drawn;
    if (toParty) {
      drawn = arrow(node, from.x, toParty.x, step.label, {
        dashed: step.kind === "resp",
        badge: n,
        role: from.role,
      });
      to(drawn, "draw", t + 0.15, 0.9, 1);
    } else {
      const pill = make("div", `self role-${from.role}`, node);
      pill.style.left = `${from.x}px`;
      make("b", `badge role-${from.role}`, pill, String(n));
      make("span", "", pill, step.label);
      node.pill = pill;
    }
    // each row before it gives way: one stays, dimmed, and the rest go
    for (const [i, earlier] of rows.entries()) {
      const last = i === rows.length - 1;
      to(earlier, "y", t, 0.5, last ? PREV_Y : PREV_Y - 70);
      // muted in its own colors, not made see-through: the lines behind it would show
      if (last) to(earlier, "dim", t, 0.5, 1);
      else to(earlier, "opacity", t, 0.4, 0);
    }
    to(node, "y", t, 0.001, FOCUS_Y);
    show(node, t + 0.1, 0.3);
    rows.push(node);
    return node;
  };

  /**
   * Lines out of a step's listing, in a card under the row. A line with a time
   * is marked at that second, and until the next one is: one at a time.
   */
  const card = (step, picks, x, t, until) => {
    const source = step.code.text.split("\n");
    const node = make("div", "card");
    node.style.left = `${Math.min(1920 - 470, Math.max(470, x))}px`;
    node.style.top = `${CARD_TOP}px`;
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
  };

  // ---------- what is said ----------
  // Written under the scene where there is no voice to say it. Where there
  // is one, the same words on the stage would only be in its way.
  const said = make("div", "said", document.getElementById("stage"));
  const say = (text, t, dur) => {
    const line = make("p", "", said, text);
    show(line, t + 0.05, 0.3);
    hide(line, t + dur - 0.2, 0.2);
  };
  /**
   * The second a word of a beat is said. Each beat comes with its words and
   * when each starts: from the voice where there is one, and reckoned from
   * the length of the sentence where there is not.
   */
  const when = (beat, word) => {
    const plain = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = (beat.words ?? []).find((w) =>
      plain(w.text).startsWith(plain(word)),
    );
    if (!found)
      throw new Error(`“${beat.say}” has no word that starts ${word}`);
    return beat.start + found.start;
  };

  // ---------- the film, beat by beat ----------
  const agent = parties.find((p) => p.role === "agent");
  const api = parties.find((p) => p.role === "resource");
  const others = parties
    .filter((p) => p !== agent && p !== api)
    .map((p) => p.id);

  // what the agent holds, under it
  const plain = chip("token", agent.x, TRAY_Y, agent.role);
  const key = chip("key", agent.x - 150, TRAY_Y, agent.role);
  const bound = chip("bound", agent.x + 125, TRAY_Y, agent.role);
  const keystore = at(
    make("div", "keystore", stage, "keystore"),
    agent.x - 150,
    602,
  );
  // someone else, and the copy they come to hold
  const other = at(make("div", "party other"), OTHER.x, OTHER.y);
  make("strong", "", other, "Someone else");
  const places = ["tool call", "log", "trace"].map((name, i) =>
    at(make("div", "place", stage, name), 700 + i * 260, FOCUS_Y + 70),
  );
  const copy = chip("token", 960, FOCUS_Y);
  const copyBound = chip("bound", OTHER.x, OTHER.y - 92);
  /** Someone else sends the API what they hold: a row at their height. */
  const attempt = () => {
    const node = make("div", "row");
    from(node, "y", OTHER.y);
    const drawn = arrow(
      node,
      OTHER.x + PARTY_W / 2,
      api.x,
      "Request + copied token",
    );
    return { node, drawn };
  };
  // the two things to watch, shown large before the flow is told
  const watchKey = chip("key", 960 - 190, FOCUS_Y);
  const watchToken = chip("token", 960 + 190, FOCUS_Y);
  watchKey.classList.add("large");
  watchToken.classList.add("large");
  const curtain = make("div", "curtain");
  const titleCard = make("div", "title-card");
  // its short name, and the rest of its title: what is said is under it already
  make("h1", "", titleCard, flow.short);
  make("p", "", titleCard, flow.title.replace(` (${flow.short})`, ""));
  // at the end the whole stage is covered, the line that was said with it
  const close = make("div", "curtain close");
  const endCard = make("div", "title-card end-card");
  make("h1", "", endCard, "Who’s on First");
  make("p", "address", endCard, film.address);
  make("p", "basis", endCard, film.basis);

  /** What a scene put on the stage that the next one takes off. */
  let passing = [];
  const clear = (t, dur = 0.35) => {
    for (const node of passing) hide(node, t, dur);
    passing = [];
  };

  // The film does not open on an empty stage: the agent, the API and the
  // token the agent holds are there from its first frame.
  for (const p of parties) {
    const level = others.includes(p.id) ? 0 : 1;
    from(p.box, "opacity", level);
    from(p.life, "opacity", level);
  }
  from(plain, "opacity", 1);

  let told; // the step being told: its row, and the beats that tell it
  for (const [index, beat] of beats.entries()) {
    const { start: t, dur } = beat;
    if (beat.say && film.band) say(beat.say, t, dur);

    if (beat.scene === "ask") {
      // someone else, a copy of the token, and whether the API will take it
      show(other, t + 0.2, 0.4);
      const askCopy = chip("token", OTHER.x, OTHER.y - 92);
      pop(askCopy, when(beat, "copies"));
      const asked = attempt();
      show(asked.node, when(beat, "Can") - 0.1, 0.2);
      to(asked.drawn, "draw", when(beat, "Can"), 0.8, 1);
      const mark = verdict("?", null, api.x, OTHER.y + 62);
      pop(mark, when(beat, "use"));
      passing = [other, askCopy, asked.node, mark];
    } else if (beat.scene === "spend") {
      clear(t);
      const sent = arrow(make("div", "row"), agent.x, api.x, "Request + token");
      from(sent.parentNode, "y", FOCUS_Y);
      show(sent.parentNode, t + 0.3, 0.2);
      to(sent, "draw", t + 0.4, 0.9, 1);
      const ok = verdict("200 OK", true, api.x, FOCUS_Y + 62);
      pop(ok, when(beat, "spend"));
      passing = [sent.parentNode, ok];
    } else if (beat.scene === "copy") {
      const named = ["tool", "logs", "traces"];
      for (const [i, place] of places.entries())
        show(place, when(beat, named[i]) - 0.1, 0.3);
      // the token is in the log too: a copy of it settles there
      show(copy, when(beat, "logs") + 0.3, 0.3);
      to(copy, "y", when(beat, "logs") + 0.4, 0.7, 128, "out");
      passing.push(copy, ...places);
    } else if (beat.scene === "steal") {
      show(other, t, 0.4);
      to(copy, "y", t + 0.3, 0.6, OTHER.y - 92 - FOCUS_Y);
      const taken = attempt();
      show(taken.node, t + 0.8, 0.2);
      to(taken.drawn, "draw", t + 0.9, 0.8, 1);
      const ok = verdict("200 OK", true, api.x, OTHER.y + 62);
      pop(ok, Math.max(t + 1.8, when(beat, "works")));
      passing.push(other, taken.node, ok);
    } else if (beat.scene === "title") {
      show(curtain, t, 0.5);
      show(titleCard, t + 0.3, 0.5);
      // behind the curtain, the stage is set for the flow itself
      const reset = t + 1;
      passing.push(plain);
      clear(reset, 0.01);
      light(reset, []);
      hide(titleCard, t + dur - 0.5, 0.4);
      hide(curtain, t + dur - 0.4, 0.4);
    } else if (beat.scene === "cast") {
      // each party as it is named, and then the two things to watch
      const names = { agent: "agent", authz: "authorization", resource: "API" };
      const lit = [];
      for (const p of parties) {
        lit.push(p.id);
        light(when(beat, names[p.role] ?? p.label.split(" ")[0]) - 0.1, [
          ...lit,
        ]);
      }
      pop(watchKey, when(beat, "key"));
      pop(watchToken, when(beat, "token"));
      passing = [watchKey, watchToken];
    } else if (beat.step) {
      const step = flow.steps[beat.step - 1];
      const sender = party(step.from);
      const receiver = step.to ? party(step.to) : null;
      // the beats that tell this step: this one, and those after it for the same step
      const first = beats[index - 1]?.step !== beat.step;
      if (first) {
        clear(t);
        const telling = [];
        for (let i = index; beats[i]?.step === beat.step; i++)
          telling.push(beats[i]);
        const last = telling[telling.length - 1];
        light(t, [sender.id, ...(receiver ? [receiver.id] : [])]);
        told = { row: row(step, beat.step, t), until: last.start + last.dur };
      }
      if (beat.show)
        card(
          step,
          beat.show.map((pick) => ({
            ...pick,
            at: pick.on ? when(beat, pick.on) : undefined,
          })),
          receiver ? (sender.x + receiver.x) / 2 : sender.x,
          t,
          told.until,
        );
      // what a party comes to hold, at the word that says so
      if (beat.gain)
        for (const [, what] of step.gain ?? []) {
          if (what.startsWith("private key")) pop(key, when(beat, beat.gain));
          else if (what.startsWith("access token"))
            pop(bound, when(beat, beat.gain));
        }
      if (beat.check) {
        const tick = make("em", "tick", told.row.pill, "✓");
        pop(tick, when(beat, beat.check));
      }
    } else if (beat.scene === "refuse") {
      light(t, [api.id]);
      // the flow has been told: its rows leave the stage to what happens next
      for (const earlier of rows) to(earlier, "opacity", t, 0.4, 0);
      show(other, t + 0.2, 0.4);
      pop(copyBound, when(beat, "copy"));
      const tried = attempt();
      show(tried.node, when(beat, "Without") - 0.1, 0.2);
      to(tried.drawn, "draw", when(beat, "Without"), 0.8, 1);
      const no = verdict("Refused: no proof", false, api.x, OTHER.y + 62);
      pop(no, when(beat, "refuses"));
      passing = [other, copyBound, tried.node, no];
    } else if (beat.scene === "caveat") {
      clear(t, 0.4);
      light(t, [agent.id]);
      // the key leaves the token's side, for a place of its own
      show(keystore, when(beat, "keep") - 0.2, 0.4);
      to(key, "y", when(beat, "keep"), 0.8, 590 - TRAY_Y);
    } else if (beat.scene === "end") {
      show(close, t, 0.5);
      show(endCard, t + 0.3, 0.5);
    }
  }
  // ---------- one frame ----------
  for (const track of tracks) track.keys.sort((a, b) => a.t - b.t);
  const nodes = [...new Set(tracks.map((t) => t.node))];
  /** Puts the stage as it is at second `t`, and says what that is, so a frame like the last is not drawn twice. */
  window.seek = (t) => {
    const now = new Map(nodes.map((node) => [node, {}]));
    for (const track of tracks)
      now.get(track.node)[track.prop] = valueAt(track, t);
    let signature = "";
    for (const [node, v] of now) {
      if (v.draw !== undefined) node.drawTo(v.draw);
      if (v.opacity !== undefined) node.style.opacity = v.opacity.toFixed(3);
      if (v.dim !== undefined)
        node.style.setProperty("--dim", v.dim.toFixed(3));
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
