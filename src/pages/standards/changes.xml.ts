import type { APIRoute } from "astro";
import { history } from "../../data/history";
import { std } from "../../data/standards";
import { feedOf } from "../../lib/history";
import { inline } from "../../lib/md";

// The changelog as a feed, written when the site is built and served from this
// origin: for anyone who follows the tracker in a feed reader. An event's text
// is formatted as the timeline formats it.
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL("https://whosonfirst.ai")).origin;
  return new Response(
    feedOf(
      history,
      origin,
      (id) => std(id).name,
      (text) => inline(text),
    ),
    { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } },
  );
};
