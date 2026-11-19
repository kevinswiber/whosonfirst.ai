import type { APIRoute } from "astro";
import { history } from "../../data/history";
import { std } from "../../data/standards";
import { feedOf } from "../../lib/history";

// The changelog as a feed, written when the site is built and served from this
// origin: for anyone who follows the tracker in a feed reader.
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL("https://whosonfirst.ai")).origin;
  return new Response(
    feedOf(history, origin, (id) => std(id).name),
    { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } },
  );
};
