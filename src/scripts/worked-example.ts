/**
 * <worked-example>: narrows an example page to what the reader has selected.
 *
 * The page is complete without this script: the starting design, every
 * variation and every build path are all in the HTML, in order. This element
 * hides what is not selected, keeps the selection in the address so it can be
 * shared and returned to, and lands a link to a variation on that variation.
 *
 * Selection is a set of tokens. A control contributes its `data-token` when it
 * is checked, the chosen build path contributes `path:<id>`, and the host can
 * derive more with `data-derive="name:a+b"`. An element with `data-if` is
 * shown when every token it lists is selected; `!token` means not selected.
 */
const TRAIL_KEY = "wof:trail";

class WorkedExample extends HTMLElement {
  #controls: HTMLInputElement[] = [];
  #paths: HTMLButtonElement[] = [];
  #path = "";
  #moved: string | null = null;
  #live: HTMLElement | null = null;

  connectedCallback() {
    this.#controls = [
      ...this.querySelectorAll<HTMLInputElement>("input[data-token]"),
    ];
    this.#paths = [
      ...this.querySelectorAll<HTMLButtonElement>("button[data-path]"),
    ];
    this.#live = this.querySelector<HTMLElement>("[data-live]");
    for (const el of this.querySelectorAll<HTMLElement>("[data-js]"))
      el.hidden = false;
    this.dataset.enhanced = "";

    // what the address says
    const params = new URLSearchParams(location.search);
    for (const c of this.#controls) {
      if (c.type === "radio") {
        if (params.get(c.name) === c.value) c.checked = true;
      } else if (params.has(c.name)) c.checked = true;
    }
    this.#path = params.get("path") ?? this.#paths[0]?.dataset.path ?? "";

    // a link to a variation selects it
    const target = location.hash
      ? document.getElementById(location.hash.slice(1))
      : null;
    const select = target?.closest<HTMLElement>("[data-select]");
    if (select && this.contains(select))
      this.#apply(select.dataset.select ?? "", true);

    this.#render(false);
    if (target && this.contains(target))
      requestAnimationFrame(() => this.#land(target));

    // a link to a variation followed while already on the page
    addEventListener("hashchange", () => {
      const to = location.hash
        ? document.getElementById(location.hash.slice(1))
        : null;
      if (!to || !this.contains(to)) return;
      const pick = to.closest<HTMLElement>("[data-select]");
      if (pick) {
        this.#apply(pick.dataset.select ?? "", true);
        this.#render(false);
      }
      this.#land(to);
    });

    this.addEventListener("change", (e) => {
      if (!(e.target instanceof HTMLInputElement) || !e.target.dataset.token)
        return;
      this.#render(true);
    });
    this.addEventListener("click", (e) => {
      const el = e.target instanceof Element ? e.target : null;
      const path = el?.closest<HTMLButtonElement>("button[data-path]");
      if (path) {
        this.#path = path.dataset.path ?? "";
        this.#moved = null;
        this.#render(true);
        return;
      }
      const set = el?.closest<HTMLButtonElement>(
        "button[data-check], button[data-uncheck]",
      );
      if (set) {
        this.#apply(set.dataset.check ?? "", true);
        this.#apply(set.dataset.uncheck ?? "", false);
        this.#render(true);
        this.querySelector<HTMLElement>(
          "[data-controls] input:checked",
        )?.focus();
        return;
      }
      // remember where a reader left for a flow page, so that page can offer the way back
      const out = el?.closest<HTMLAnchorElement>('a[href^="/flows/"]');
      if (out) {
        const at = this.#returnPoint(out);
        try {
          sessionStorage.setItem(
            TRAIL_KEY,
            JSON.stringify({
              title: this.dataset.title ?? document.title,
              path: location.pathname,
              href: `${location.pathname}${location.search}${at ? `#${at.id}` : ""}`,
            }),
          );
        } catch {}
      }
    });
  }

  /**
   * Where a link sits, as somewhere to come back to: the marked part that
   * contains it, or else the nearest marked heading above it. Parts the
   * reader has not selected are passed over, since returning to one would
   * select it.
   */
  #returnPoint(link: Element): HTMLElement | undefined {
    const inside = link.closest<HTMLElement>("[data-return]");
    if (inside) return inside;
    return [...this.querySelectorAll<HTMLElement>("[data-return]")]
      .filter(
        (m) =>
          !m.closest("[hidden]") &&
          m.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
      )
      .pop();
  }

  /** Check or uncheck the controls that carry these tokens. */
  #apply(tokens: string, on: boolean) {
    for (const t of tokens.split(/\s+/).filter(Boolean)) {
      for (const c of this.#controls) {
        if (c.dataset.token !== t) continue;
        if (c.type === "radio") {
          if (on) c.checked = true;
        } else c.checked = on;
      }
    }
  }

  #tokens(): Set<string> {
    const set = new Set<string>();
    for (const c of this.#controls)
      if (c.checked && c.dataset.token) set.add(c.dataset.token);
    for (const rule of (this.dataset.derive ?? "")
      .split(/\s+/)
      .filter(Boolean)) {
      const [name, needs] = rule.split(":");
      if (needs.split("+").every((t) => set.has(t))) set.add(name);
    }
    return set;
  }

  #matches(el: HTMLElement, tokens: Set<string>): boolean {
    return (el.dataset.if ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .every((t) =>
        t.startsWith("!") ? !tokens.has(t.slice(1)) : tokens.has(t),
      );
  }

  #render(fromReader: boolean) {
    const tokens = this.#tokens();

    // a path the selected case does not have is never left selected out of sight
    const open = this.#paths.filter((b) => this.#matches(b, tokens));
    if (open.length && !open.some((b) => b.dataset.path === this.#path)) {
      const was = this.#paths.find((b) => b.dataset.path === this.#path);
      this.#moved = was
        ? `The path “${was.dataset.label}” is written up for ${was.dataset.only ?? "another case"} only, so ${open[0].dataset.label} is selected instead.`
        : null;
      this.#path = open[0].dataset.path ?? "";
    } else if (!this.#moved || !open.length) this.#moved = null;
    if (this.#path) tokens.add(`path:${this.#path}`);
    for (const b of this.#paths)
      b.setAttribute("aria-pressed", String(b.dataset.path === this.#path));

    for (const el of this.querySelectorAll<HTMLElement>("[data-if]"))
      el.hidden = !this.#matches(el, tokens);
    const moved = this.querySelector<HTMLElement>("[data-moved]");
    if (moved) {
      moved.textContent = this.#moved ?? "";
      moved.hidden = !this.#moved;
    }

    if (!fromReader) return;
    const q = new URLSearchParams();
    for (const c of this.#controls) {
      if (!c.checked || c.dataset.default !== undefined) continue;
      q.set(c.name, c.type === "radio" ? c.value : "1");
    }
    if (this.#path && this.#path !== this.#paths[0]?.dataset.path)
      q.set("path", this.#path);
    const qs = q.toString();
    history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
    if (this.#live) {
      const showing = [...this.querySelectorAll<HTMLElement>("[data-announce]")]
        .filter((el) => !el.closest("[hidden]"))
        .map((el) => el.textContent?.trim().replace(/\s+/g, " "))
        .join(" ");
      this.#live.textContent = [showing || this.dataset.base, this.#moved]
        .filter(Boolean)
        .join(" ");
    }
  }

  /** Bring a link's target to the top and put keyboard focus on its heading. */
  #land(target: HTMLElement) {
    const heading = target.matches("h1, h2, h3, h4")
      ? target
      : (target.querySelector<HTMLElement>("h2, h3, h4") ?? target);
    if (!heading.hasAttribute("tabindex"))
      heading.setAttribute("tabindex", "-1");
    target.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  }
}

customElements.define("worked-example", WorkedExample);

export {};
