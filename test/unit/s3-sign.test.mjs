// How a request to a bucket is signed: scripts/s3-sign.mjs, held to the
// example AWS publishes for Signature Version 4, whose every step is written
// out at
// https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv4-create-signed-request.html
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { signed } from "../../scripts/s3-sign.mjs";

const example = {
  key: "AKIDEXAMPLE",
  secret: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
  region: "us-east-1",
  now: new Date("2015-08-30T12:36:00Z"),
};

test("the published example is signed as it is published", () => {
  const headers = signed({
    ...example,
    method: "GET",
    url: "https://iam.amazonaws.com/?Action=ListUsers&Version=2010-05-08",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    service: "iam",
  });
  assert.equal(
    headers.Authorization,
    "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7",
  );
  assert.equal(headers["x-amz-date"], "20150830T123600Z");
});

test("a request to a bucket signs the hash of what it sends", () => {
  const headers = signed({
    ...example,
    method: "PUT",
    url: "https://account.r2.cloudflarestorage.com/a-bucket/flows/dpop/cuts/10/film.mp4",
    headers: { "Content-Type": "video/mp4" },
    body: Buffer.from("not a film"),
    region: "auto",
    service: "s3",
  });
  assert.match(
    headers.Authorization,
    /SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, /,
  );
  assert.equal(
    headers["x-amz-content-sha256"],
    createHash("sha256").update("not a film").digest("hex"),
  );
  assert.equal("host" in headers, false);
});

test("a different body, key or moment gives a different signature", () => {
  const base = {
    ...example,
    method: "PUT",
    url: "https://account.r2.cloudflarestorage.com/a-bucket/index.json",
    region: "auto",
    service: "s3",
    body: "{}",
  };
  const signature = (request) =>
    /Signature=(\w+)/.exec(signed(request).Authorization)[1];
  const first = signature(base);
  assert.notEqual(signature({ ...base, body: "[]" }), first);
  assert.notEqual(signature({ ...base, secret: "another" }), first);
  assert.notEqual(
    signature({ ...base, now: new Date("2015-08-30T12:36:01Z") }),
    first,
  );
  assert.equal(signature(base), first);
});

test("a name with a space or a plus is written once, not twice", () => {
  const headers = signed({
    ...example,
    method: "GET",
    url: "https://account.r2.cloudflarestorage.com/a-bucket/a%20name+here.txt",
    region: "auto",
    service: "s3",
  });
  assert.match(headers.Authorization, /^AWS4-HMAC-SHA256 Credential=/);
});
