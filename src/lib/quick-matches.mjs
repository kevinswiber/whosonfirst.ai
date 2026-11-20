// Quick matches use only the small directory shipped with the page. Each term
// must match a word or the start of a word. Names and identifiers rank first.
const words = (text) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

function rank(record, query, terms) {
  const names = [record.title, ...record.aliases].map(words);
  const compact = query.replaceAll(" ", "");
  const covers = (tokens) =>
    terms.every((term) => tokens.some((word) => word.startsWith(term)));

  // RFC 9449, RFC-9449 and RFC9449 name the same entry.
  if (names.some((tokens) => tokens.join("") === compact)) return 0;
  if (names.some((tokens) => tokens.join(" ").startsWith(query))) return 1;
  if (
    terms.length === 1 &&
    names.some((tokens) => tokens.join("").startsWith(compact))
  )
    return 1;
  if (names.some(covers)) return 2;
  if (covers([...names.flat(), ...words(record.summary)])) return 3;
  return Infinity;
}

export function quickMatches(records, query) {
  const terms = words(query);
  if (!terms.length) return [];
  const phrase = terms.join(" ");
  return (
    records
      .map((record) => ({ record, rank: rank(record, phrase, terms) }))
      .filter((hit) => Number.isFinite(hit.rank))
      // Stable sort keeps the directory's order among equally good matches.
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5)
      .map((hit) => hit.record)
  );
}
