// How implementation-check.mjs reads a page and a quote, so that a sentence
// copied from the page as a reader sees it is found in the HTML or Markdown
// the server sends. Kept apart so that test/unit/implementations.test.mjs can
// check it without the network.

/** Text as a reader sees it, near enough to find a copied sentence in. */
export const plain = (text) =>
  text
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    // A Markdown link keeps its text and loses its address, as in HTML.
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<!--[\s\S]*?-->|<![a-z][^>]*>/gi, " ")
    // Only what looks like a tag: raw Markdown can have a < in its text.
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/gi, " ")
    .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(`0x${h}`))
    .replace(/\\[nrt]/g, " ")
    .replace(/\\(["'/\\])/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(`0x${h}`))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&(apos|rsquo|lsquo);/g, "'")
    .replace(/&(ldquo|rdquo);/g, '"')
    .replace(/&(ndash|mdash);/g, "-")
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[ ​­]/g, " ")
    .replace(/[*_`[\]()#>|]/g, " ")
    .replace(/\s+/g, " ")
    // Markup removed before punctuation leaves a space a reader does not see.
    .replace(/ ([,.;:!?])/g, "$1")
    .toLowerCase()
    .trim();
