/**
 * Signs a request the way S3's interface asks, with a key and its secret:
 * AWS Signature Version 4. scripts/film-assets.mjs uses it to reach an R2
 * bucket with keys that are for that bucket alone.
 *
 * It is here, and not a package, because it is one hash and three HMACs. How
 * it is done is at
 * https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv4-create-signed-request.html
 * and test/unit/s3-sign.test.mjs holds it to the example published there.
 */
import { createHash, createHmac } from "node:crypto";

const hex = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
/** A part of a path or a query, written as the signature expects it. */
const encoded = (text) =>
  encodeURIComponent(text).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

/**
 * The headers to send with a request so that it is accepted: those given,
 * with the time and an `Authorization` that signs the method, the address,
 * those headers and the body.
 *
 * `url` is the whole address. `body` is what is sent, a Buffer or a string,
 * or nothing. `now` is when: it is given so that a test can name a moment.
 */
export function signed({
  method,
  url,
  headers = {},
  body = "",
  key,
  secret,
  region,
  service,
  now = new Date(),
}) {
  const at = new URL(url);
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const day = stamp.slice(0, 8);
  const sent = { ...headers, host: at.host, "x-amz-date": stamp };
  // S3 asks for the body's hash as a header of its own, and signs it
  if (service === "s3") sent["x-amz-content-sha256"] = hex(body);
  const names = Object.keys(sent)
    .map((name) => name.toLowerCase())
    .sort();
  const lower = Object.fromEntries(
    Object.entries(sent).map(([name, value]) => [
      name.toLowerCase(),
      String(value).trim().replace(/\s+/g, " "),
    ]),
  );
  const query = [...at.searchParams]
    .map(([name, value]) => `${encoded(name)}=${encoded(value)}`)
    .sort()
    .join("&");
  // each part of the path is written once: S3 does not want it written twice
  const path = at.pathname
    .split("/")
    .map((part) => encoded(decodeURIComponent(part)))
    .join("/");
  const request = [
    method,
    path,
    query,
    ...names.map((name) => `${name}:${lower[name]}`),
    "",
    names.join(";"),
    hex(body),
  ].join("\n");
  const scope = `${day}/${region}/${service}/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", stamp, scope, hex(request)].join("\n");
  const signing = [day, region, service, "aws4_request"].reduce(
    (secretKey, part) => hmac(secretKey, part),
    `AWS4${secret}`,
  );
  const signature = createHmac("sha256", signing).update(toSign).digest("hex");
  delete sent.host; // fetch writes this one itself
  return {
    ...sent,
    Authorization: `AWS4-HMAC-SHA256 Credential=${key}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`,
  };
}
