#!/usr/bin/env node
// sheo-check's runner bridge for this project: Node's own test runner
// (node:test), so it needs nothing installed. Seeded once into the project
// as tools/sheo-bridge.mjs by nirnroot's Node profile; the project owns it
// from then on.
//
//   node tools/sheo-bridge.mjs run-under DIR...   every *.test.mjs under these folders
//   node tools/sheo-bridge.mjs run ID...          these tests
//   node tools/sheo-bridge.mjs get PATH...        the ids of the tests under these paths
//   node tools/sheo-bridge.mjs written-under DIR...   are the tests under these folders written
//   node tools/sheo-bridge.mjs written ID...          are these tests written
//   node tools/sheo-bridge.mjs commit-get PATH...     commit's ids: the Node whose code a path is, and the test files
//   node tools/sheo-bridge.mjs commit-under DIR...    the tests under these folders, as a commit is held to them
//   node tools/sheo-bridge.mjs commit ID...           these tests (and Nodes), as a commit is held to them
//   node tools/sheo-bridge.mjs tested-under DIR...    the tests under these folders, which must be written
//   node tools/sheo-bridge.mjs tested ID...           these tests, which must be written
//   node tools/sheo-bridge.mjs ready-get PATH...      ready's ids: the Node whose code a path is (src/<id>/)
//   node tools/sheo-bridge.mjs ready-under DIR...     every Node whose code is under these folders
//   node tools/sheo-bridge.mjs ready ID...            these Nodes: is what their documents reference implemented
//
// `written` is the check of whoever writes a test before the code it tests
// (an edge's tester): the file is run, and it passes when it loads and holds
// at least one test that ran, whatever the result. A failing test is said
// (red) and doesn't fail it: passing the test is the implementer's, under
// `run`. A file that doesn't load, holds no test, or only skipped ones (the
// seeded pending test) is not written.
//
// `tested` is the check of whoever writes both a thing and its tests (an API
// Shape's implementer, a Node's fixture agent): as `run`, and a file whose
// every test is skipped (the seeded pending test) fails too. The tests must
// be written, and pass; and the code they are of (the shape's, the
// fixture's) must no longer export `_sheo_stub`: removing it is that agent's
// own part.
//
// `commit` is the check of a Node's implementer on each commit, so that it
// waits on no Node below it to work, and code that may be right reaches the
// merge rather than being rewritten to pass a test that may be wrong. Every
// test is run and told, none held: a test under tests/internal/<node>/ or
// tests/edges/<node>/ is <node>'s; the Node committing is the one whose tests
// are here and whose parent's aren't (the tree is .nirnroot/docs/tree.json, as
// nirnroot published it: the one source of a Node's parent). With commit-get's
// ids (the agent's patterns name its code, src/<id>/, first), the Node
// committing is the one whose code that is, and its id is a record of its
// own: its code must no longer be the placeholder (a module of it that still
// exports `_sheo_stub`). It is told, held by nothing, which parts its
// documents reference aren't implemented yet (as `ready` says them). It is
// `run`, at the merge, that holds all of them.
//
// `ready` is the check of a Node's promotion (an implementer's merge, never a
// commit): for each id, a Node's code, every part its documents reference is
// implemented in this checkout: its own code and its own edge test, each
// direct child's code and edge test, each shape its implementer and its
// tester see, each fixture its ITDs and EETs list. Implemented: no module of
// its code exports `_sheo_stub`, and its tests hold a test file, none
// exporting `_sheo_pending`. Each part that isn't is named with its agent.
// What the documents reference is .nirnroot/scope.json (nirnroot's seed-tree
// writes it, from them): with no such file (a project that predates it),
// `ready` passes and says so, and lint keeps the layout's rules below.
//
//   node tools/sheo-bridge.mjs lint-get PATH...      the modules (.mjs, .js) under these paths
//   node tools/sheo-bridge.mjs lint-under DIR...     lint the modules under these folders
//   node tools/sheo-bridge.mjs lint ID...            lint these modules
//
// `lint` is everyone's, on every commit: it needs nothing else of the tree
// written. A module passes when Node parses it; each import resolves (a
// relative path to a file that is there, an installed package, node's own),
// and each name imported from the project exists; no import is absolute
// (/work/repo/...); its folder's import rule holds. With .nirnroot/scope.json
// the rule is the documents' (scopeRule: each folder imports what its agent's
// documents give it: a Node's code its children's call sites and its shapes,
// its tests the shapes and fixtures their documents list, a shape the shapes
// it is made of). Without it, the layout's (src/<id>/: its own
// folder, its children's call sites, shapes/; shapes/: shapes/;
// tests/edges/<id>/: its own folder, <id>'s call site, shapes/, and the
// fixtures of <id>'s ancestors (tests/fixtures/<ancestor>/), never src/;
// tests/internal/<id>/: its own folder, src/<id>/, its own and its children's call sites, shapes/,
// and its ancestors' fixtures; tests/shapes/<id>/: its own folder, shapes/;
// tests/fixtures/<id>/: its own folder, shapes/ and <id>'s children's call
// sites, never src/, never another Node's fixtures, never <id>'s own call
// site). The tree is tree.json's. Which fixtures a tester may use is its
// scope's (the ones its documents list, visible to it); lint holds the
// structure: a fixture flows down the tree only. And a test file
// (*.test.mjs) asserts something, the seeded pending test aside. What a
// module imports is linted as that file's own, not this one's.
//
// A test id is a test file's path (tests/edges/dice/edge.test.mjs):
// listing ids never runs a test, and a file's result is its tests' (failed
// if any failed, with their names and messages). Each file runs in its own
// process, with a time-out per test (SHEO_BRIDGE_TIMEOUT_MS, default 120000).
//
// A browser test is a test file named <name>.browser.test.mjs. It is written
// as any other test file (`import test from "node:test"`, `import assert
// from "node:assert/strict"`, the project's code and packages by their
// usual paths) and runs in headless Chromium, with WebGL, instead of in
// Node:
//   - the page holds one 800x600 <canvas> at its top left corner, and
//     nothing else: `document.querySelector("canvas")`. The viewport is
//     800x600, so the canvas's pixels are the page's. Each file gets a
//     fresh page.
//   - the file and what it imports are bundled for the browser (esbuild),
//     so only code that runs in a browser can be imported: no `node:fs`,
//     no server.
//   - `node:test` and `node:assert/strict` are the page's own, with the
//     common part of Node's: test (and test.skip, test.todo, the options
//     skip, todo, timeout), it, describe/suite, before, after, beforeEach,
//     afterEach, and the test context's skip(), todo(), diagnostic() and
//     name; assert's ok, equal, notEqual, strictEqual, notStrictEqual,
//     deepEqual, deepStrictEqual, notDeepEqual, notDeepStrictEqual, match,
//     doesNotMatch, throws, doesNotThrow, rejects, doesNotReject, fail.
//     Tests run one after another, in the order written.
//   - the page is served from http://127.0.0.1:<port>/, and the project's
//     asset area under /assets/ (assets/ui/mute.png is at
//     /assets/ui/mute.png). Every other path answers 404: a test that
//     needs another answer replaces `fetch`. Nothing outside the page is
//     reachable.
//   - an error the page throws outside a test (an import that fails, an
//     uncaught rejection) fails the file.
// Its id, its results and the checks above are as for any test file.
//
// stdout is the payload alone ({"tests": [...]}, sheo-check's format); the
// tests' own output goes to the log file (SHEO_BRIDGE_LOG, default
// .sheo-check.log). Exit 0 when every test passed or was skipped, 1 when one
// failed, 3 when the bridge itself broke (no payload: never a pass).

import { run } from "node:test";
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inspect } from "node:util";

const LOG = process.env.SHEO_BRIDGE_LOG || ".sheo-check.log";
const TIMEOUT = Number(process.env.SHEO_BRIDGE_TIMEOUT_MS || 120000);
const CAP = 2000;

function filesUnder(p) {
  const at = p.replace(/\/+$/, "") || ".";
  if (!existsSync(at)) return [];
  if (statSync(at).isFile()) return at.endsWith(".test.mjs") ? [path.normalize(at)] : [];
  const out = [];
  for (const name of readdirSync(at).sort()) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    out.push(...filesUnder(path.join(at, name)));
  }
  return out;
}

function unique(xs) {
  return [...new Set(xs)];
}

function head(text) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).filter((l) => !l.startsWith("at ")).slice(0, 4)
    .join(" | ");
}

// A failing test's error as text. What a test threw may be anything, and String() throws on some of it: an
// error that can't be copied out of the test's process (it holds a function) comes back as Node's stand-in,
// an object with no prototype that only util.inspect prints. Never throws: a crash here broke the whole check.
function message(err) {
  const e = err?.cause ?? err;
  const v = e?.stack || e?.message || e || "failed";
  if (typeof v === "string") return v;
  try { return inspect(v); }
  catch { return "the test failed with a value that can't be printed"; }
}

// ---------------------------------------------------------------- browser tests

const isBrowser = (f) => f.endsWith(".browser.test.mjs");

// node:test in the page: the common part of Node's, collecting each top-level
// test's result (a suite's is its tests'). Tests run in order, after the file has loaded.
const PAGE_TEST = String.raw`
const results = [];
const root = { name: "", tests: [], hooks: { before: [], after: [], beforeEach: [], afterEach: [] }, parent: null };
let at = root;
const DEFAULT = __TIMEOUT__;
function opts(a, b) {
  const o = typeof a === "object" && a !== null ? a : {};
  const fn = typeof a === "function" ? a : b;
  return [o, fn];
}
function add(name, a, b, extra) {
  const [o, fn] = opts(a, b);
  at.tests.push({ name: String(name), fn, opts: { ...o, ...extra }, suite: null });
}
function addSuite(name, a, b, extra) {
  const [o, fn] = opts(a, b);
  const s = { name: String(name), tests: [], hooks: { before: [], after: [], beforeEach: [], afterEach: [] }, parent: at };
  at.tests.push({ name: String(name), fn: null, opts: { ...o, ...extra }, suite: s });
  const was = at;
  at = s;
  try { if (fn) fn(); } finally { at = was; }
}
export function test(name, a, b) { add(name, a, b); }
test.skip = (name, a, b) => add(name, a, b, { skip: true });
test.todo = (name, a, b) => add(name, a, b, { todo: true });
test.only = test;
export const it = test;
export function describe(name, a, b) { addSuite(name, a, b); }
describe.skip = (name, a, b) => addSuite(name, a, b, { skip: true });
describe.todo = (name, a, b) => addSuite(name, a, b, { todo: true });
describe.only = describe;
export const suite = describe;
export const before = (fn) => at.hooks.before.push(fn);
export const after = (fn) => at.hooks.after.push(fn);
export const beforeEach = (fn) => at.hooks.beforeEach.push(fn);
export const afterEach = (fn) => at.hooks.afterEach.push(fn);
test.test = test; test.it = it; test.describe = describe; test.suite = suite;
test.before = before; test.after = after; test.beforeEach = beforeEach; test.afterEach = afterEach;
export default test;

const text = (e) => String((e && (e.stack && String(e.stack).includes(String(e.message)) ? e.stack : e.message)) || e);
function limit(p, ms, what) {
  let timer;
  return Promise.race([
    Promise.resolve().then(p),
    new Promise((_, no) => { timer = setTimeout(() => no(new Error(what + " timed out after " + ms + " ms")), ms); }),
  ]).finally(() => clearTimeout(timer));
}
function chain(s, kind) {
  const out = [];
  for (let x = s; x; x = x.parent) out.unshift(...x.hooks[kind]);
  return out;
}
async function runOne(t, s, prefix, skipped) {
  const name = prefix + t.name;
  if (skipped || t.opts.skip || t.opts.todo || (!t.suite && !t.fn)) return [{ name, status: "skipped" }];
  if (t.suite) return runSuite(t.suite, name + " > ");
  const ctx = { name: t.name, skipped: false, diagnostic() {}, skip() { ctx.skipped = true; }, todo() { ctx.skipped = true; },
                signal: new AbortController().signal };
  const ms = Number(t.opts.timeout) || DEFAULT;
  try {
    for (const h of chain(s, "beforeEach")) await limit(() => h(ctx), ms, "beforeEach");
    await limit(() => t.fn(ctx), ms, "the test");
    for (const h of chain(s, "afterEach").reverse()) await limit(() => h(ctx), ms, "afterEach");
    return [{ name, status: ctx.skipped ? "skipped" : "passed" }];
  } catch (e) {
    return [{ name, status: "failed", message: text(e) }];
  }
}
async function runSuite(s, prefix, skipped = false) {
  const out = [];
  try {
    for (const h of s.hooks.before) await limit(h, DEFAULT, "before");
  } catch (e) {
    return [{ name: prefix + "before", status: "failed", message: text(e) }];
  }
  for (const t of s.tests) out.push(...await runOne(t, s, prefix, skipped));
  try {
    for (const h of s.hooks.after) await limit(h, DEFAULT, "after");
  } catch (e) {
    out.push({ name: prefix + "after", status: "failed", message: text(e) });
  }
  return out;
}
globalThis.__sheo_run = async () => {
  const started = performance.now();
  const tests = await runSuite(root, "");
  return { tests, seconds: (performance.now() - started) / 1000 };
};
`;

// node:assert/strict in the page: the common part of Node's.
const PAGE_ASSERT = String.raw`
export class AssertionError extends Error {
  constructor(o) {
    super(typeof o === "string" ? o : o && o.message);
    this.name = "AssertionError";
    this.code = "ERR_ASSERTION";
    if (o && typeof o === "object") { this.actual = o.actual; this.expected = o.expected; this.operator = o.operator; }
  }
}
const show = (v) => {
  if (typeof v === "function") return "[Function " + (v.name || "anonymous") + "]";
  if (typeof v === "symbol" || typeof v === "bigint" || v === undefined) return String(v);
  try { return JSON.stringify(v, (k, x) => (typeof x === "bigint" ? String(x) + "n" : x === undefined ? "undefined" : x)) ?? String(v); }
  catch { return String(v); }
};
function same(a, b, seen = new Map()) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (seen.get(a) === b) return true;
  seen.set(a, b);
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return String(a) === String(b);
  if (a instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && same(v, b.get(k), seen));
  if (a instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v) || [...b].some((w) => same(v, w, seen)));
  if (ArrayBuffer.isView(a)) return a.length === b.length && Array.prototype.every.call(a, (v, i) => Object.is(v, b[i]));
  if (Array.isArray(a) && a.length !== b.length) return false;
  const ka = Reflect.ownKeys(a).filter((k) => Object.prototype.propertyIsEnumerable.call(a, k));
  const kb = Reflect.ownKeys(b).filter((k) => Object.prototype.propertyIsEnumerable.call(b, k));
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k], seen));
}
function no(message, dflt, actual, expected, operator) {
  if (message instanceof Error) throw message;
  throw new AssertionError({ message: message ?? dflt, actual, expected, operator });
}
function fits(err, want) {
  if (want === undefined) return true;
  if (want instanceof RegExp) return want.test(String(err && err.message !== undefined ? err.message : err)) || want.test(String(err));
  if (typeof want === "function") {
    if (want.prototype !== undefined && err instanceof want) return true;
    if (Error.isPrototypeOf(want) || want === Error) return false;
    return want(err) === true;
  }
  if (typeof want === "object" && want !== null) {
    return Reflect.ownKeys(want).every((k) => (want[k] instanceof RegExp && typeof err[k] === "string"
      ? want[k].test(err[k]) : same(err[k], want[k])));
  }
  return false;
}
export function ok(v, message) { if (!v) no(message, "expected a truthy value, got " + show(v), v, true, "=="); }
export function equal(a, b, message) { if (!Object.is(a, b)) no(message, "expected " + show(a) + " to equal " + show(b), a, b, "strictEqual"); }
export function notEqual(a, b, message) { if (Object.is(a, b)) no(message, "expected " + show(a) + " not to equal " + show(b), a, b, "notStrictEqual"); }
export const strictEqual = equal, notStrictEqual = notEqual;
export function deepEqual(a, b, message) {
  if (!same(a, b)) no(message, "expected deep equality:\n  actual:   " + show(a) + "\n  expected: " + show(b), a, b, "deepStrictEqual");
}
export function notDeepEqual(a, b, message) { if (same(a, b)) no(message, "expected deep inequality: " + show(a), a, b, "notDeepStrictEqual"); }
export const deepStrictEqual = deepEqual, notDeepStrictEqual = notDeepEqual;
export function match(s, re, message) { if (!re.test(s)) no(message, "expected " + show(s) + " to match " + re, s, re, "match"); }
export function doesNotMatch(s, re, message) { if (re.test(s)) no(message, "expected " + show(s) + " not to match " + re, s, re, "doesNotMatch"); }
export function fail(message) { no(message, "Failed", undefined, undefined, "fail"); }
export function throws(fn, want, message) {
  if (typeof want === "string") { message = want; want = undefined; }
  let err, threw = false;
  try { fn(); } catch (e) { err = e; threw = true; }
  if (!threw) no(message, "expected the function to throw", undefined, want, "throws");
  if (!fits(err, want)) { if (typeof want === "function" && !(want.prototype !== undefined)) throw err; no(message, "the function threw " + show(String(err)) + ", which isn't what was expected", err, want, "throws"); }
}
export function doesNotThrow(fn, message) {
  try { fn(); } catch (e) { no(typeof message === "string" ? message : undefined, "expected the function not to throw, got " + String(e), e, undefined, "doesNotThrow"); }
}
export async function rejects(p, want, message) {
  if (typeof want === "string") { message = want; want = undefined; }
  let err, threw = false;
  try { await (typeof p === "function" ? p() : p); } catch (e) { err = e; threw = true; }
  if (!threw) no(message, "expected the promise to reject", undefined, want, "rejects");
  if (!fits(err, want)) no(message, "the promise rejected with " + show(String(err)) + ", which isn't what was expected", err, want, "rejects");
}
export async function doesNotReject(p, message) {
  try { await (typeof p === "function" ? p() : p); }
  catch (e) { no(typeof message === "string" ? message : undefined, "expected the promise not to reject, got " + String(e), e, undefined, "doesNotReject"); }
}
export function ifError(v) { if (v !== null && v !== undefined) throw v instanceof Error ? v : new AssertionError({ message: "ifError got unwanted exception: " + show(v), actual: v }); }
const assert = (v, message) => ok(v, message);
Object.assign(assert, { AssertionError, ok, equal, notEqual, strictEqual, notStrictEqual, deepEqual, notDeepEqual,
  deepStrictEqual, notDeepStrictEqual, match, doesNotMatch, fail, throws, doesNotThrow, rejects, doesNotReject, ifError });
assert.strict = assert;
export const strict = assert;
export default assert;
`;

const PAGE = `<!doctype html><meta charset="utf-8"><title>sheo</title>
<style>html,body{margin:0;padding:0;background:#202020;overflow:hidden}canvas{display:block;position:absolute;left:0;top:0}</style>
<canvas width="800" height="600" style="width:800px;height:600px"></canvas>
<script type="module" src="/__sheo/entry.js"></script>`;

const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
                ".json": "application/json", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
                ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".html": "text/html",
                ".txt": "text/plain", ".woff2": "font/woff2" };

async function browserTools() {
  const at = (p) => pathToFileURL(path.resolve("node_modules", p)).href;
  try {
    const esbuild = await import(at("esbuild/lib/main.js"));
    const { chromium } = await import(at("playwright-core/index.mjs"));
    return { esbuild: esbuild.default ?? esbuild, chromium };
  } catch (e) {
    throw new Error(`a browser test needs the project's packages (esbuild, playwright-core), which its setup `
                    + `installs: ${String(e?.message || e).split("\n")[0]}`);
  }
}

async function pageBundle(esbuild, file) {
  const shims = { "node:test": PAGE_TEST.replace("__TIMEOUT__", String(TIMEOUT)), "test": null,
                  "node:assert": PAGE_ASSERT, "node:assert/strict": PAGE_ASSERT, "assert": PAGE_ASSERT,
                  "assert/strict": PAGE_ASSERT };
  shims.test = shims["node:test"];
  const r = await esbuild.build({
    stdin: { contents: `import ${JSON.stringify(path.resolve(file))};
`, resolveDir: process.cwd(),
             sourcefile: "sheo-entry.mjs", loader: "js" },
    bundle: true, format: "esm", platform: "browser", write: false, logLevel: "silent",
    nodePaths: [path.resolve("node_modules")],
    plugins: [{ name: "sheo-page", setup(build) {
      build.onResolve({ filter: /^(node:)?(test|assert|assert\/strict)$/ }, (a) => ({ path: a.path, namespace: "sheo-page" }));
      build.onLoad({ filter: /.*/, namespace: "sheo-page" }, (a) => ({ contents: shims[a.path], loader: "js" }));
    } }],
  });
  return r.outputFiles[0].text;
}

function pageServer(js) {
  const assets = path.resolve("assets");
  return new Promise((resolve) => {
    const s = createServer((req, res) => {
      const url = decodeURIComponent((req.url || "/").split("?")[0]);
      const send = (code, type, body) => { res.writeHead(code, type ? { "content-type": type } : {}); res.end(body); };
      if (url === "/") return send(200, "text/html", PAGE);
      if (url === "/__sheo/entry.js") return send(200, "text/javascript", js);
      if (url.startsWith("/assets/")) {
        const f = path.resolve(assets, url.slice("/assets/".length));
        if (f.startsWith(assets + path.sep) && existsSync(f) && statSync(f).isFile()) {
          return send(200, TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", readFileSync(f));
        }
      }
      return send(404);
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
}

// One browser test file, in a page of its own: its record, as the Node runner's files get theirs.
async function runInPage(tools, launched, file, log) {
  const rec = { fails: [], passed: 0, skipped: 0, duration: 0, stderr: "", wrapper: null };
  let server, page;
  try {
    const js = await pageBundle(tools.esbuild, file);
    server = await pageServer(js);
    page = await launched.newPage({ viewport: { width: 800, height: 600 } });
    const errors = [];
    page.on("console", (m) => log(`[${file}] ${m.type()}: ${m.text()}`));
    page.on("pageerror", (e) => errors.push(String(e?.stack || e)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    try {
      await page.waitForFunction(() => typeof globalThis.__sheo_run === "function", null, { timeout: 30000 });
    } catch {
      throw new Error(errors.length ? errors.join("\n") : "the page never loaded the test file (it imports neither "
                                                          + "node:test nor a file that does?)");
    }
    await new Promise((r) => setTimeout(r, 50));  // an import that throws after node:test loaded
    if (errors.length) throw new Error(errors.join("\n"));
    const out = await page.evaluate(() => globalThis.__sheo_run());
    rec.duration = out.seconds;
    for (const t of out.tests) {
      if (t.status === "failed") {
        rec.fails.push({ name: t.name, message: t.message || "failed" });
        log(`FAIL ${file} > ${t.name}
${t.message || ""}`);
      } else if (t.status === "skipped") rec.skipped += 1;
      else rec.passed += 1;
    }
    if (errors.length) {
      rec.fails.push({ name: "(the page)", message: `the page threw outside a test:
${errors.join("\n")}` });
      log(`FAIL ${file} > (the page)
${errors.join("\n")}`);
    }
    rec.wrapper = "passed";
  } catch (e) {
    const text = String(e?.errors?.length ? e.errors.map((x) => `${x.location?.file ?? ""}:${x.location?.line ?? ""} ${x.text}`).join("\n")
                                          : e?.message || e).replace(/^page\.evaluate: /, "");
    rec.wrapper = text;
    rec.stderr = text.slice(-CAP);
    log(`FAIL ${file} (in Chromium)
${text}`);
  } finally {
    if (page) await page.close().catch(() => {});
    if (server) server.close();
  }
  return rec;
}

async function runBrowserFiles(files, per, log) {
  let tools, launched;
  try {
    tools = await browserTools();
    launched = await tools.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader",
                                                    "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
  } catch (e) {
    const text = `Chromium couldn't start: ${String(e?.message || e).split("\n").slice(0, 6).join("\n")}`;
    for (const f of files) Object.assign(per.get(f), { wrapper: text, stderr: text.slice(-CAP) });
    log(text);
    return;
  }
  try {
    for (const f of files) Object.assign(per.get(f), await runInPage(tools, launched, f, log));
  } finally {
    await launched.close().catch(() => {});
    await tools.esbuild.stop?.();
  }
}

// The tree: .nirnroot/docs/tree.json, as nirnroot published it to this checkout, the one source of a
// Node's parent (a forwarder, edges/edge_to_<child>.mjs, names none). A Node -> its parent; the root has
// none. No tree file: no tree (an empty map). One that isn't the tree's JSON is an error, never a guess.
const TREE = path.join(".nirnroot", "docs", "tree.json");
let tree = null;
function parents() {
  if (tree) return tree;
  tree = new Map();
  if (!existsSync(TREE)) return tree;
  let doc;
  try {
    doc = JSON.parse(readFileSync(TREE, "utf8"));
  } catch (e) {
    throw new Error(`${TREE}: not JSON (${e.message})`);
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new Error(`${TREE}: not an object of Nodes`);
  for (const [id, n] of Object.entries(doc)) {
    if (n && typeof n.parent === "string") tree.set(id, n.parent);
  }
  return tree;
}

// The Node whose call site a path is (edges/edge_to_<id>.mjs), or null.
function callSiteOf(t) {
  const m = /^edges\/edge_to_([^/]+)\.mjs$/.exec(t);
  return m ? m[1] : null;
}

// A Node's proper ancestors: its parent, its parent's parent, ... (none for the root).
function ancestors(node, up) {
  const out = [];
  for (let n = up.get(node); n !== undefined && !out.includes(n); n = up.get(n)) out.push(n);
  return out;
}

// The Node whose fixtures a path is in (tests/fixtures/<id>/...), or null.
function fixtureOf(t) {
  const m = /^tests\/fixtures\/([^/]+)\//.exec(t);
  return m ? m[1] : null;
}

function below(node, up) {
  const out = [];
  for (const [child, parent] of up) if (parent === node) out.push(child, ...below(child, up));
  return out.sort();
}

// A Node is implemented once its surface is no longer the seeded placeholder.
function implemented(node) {
  const f = path.join("src", node, "index.mjs");
  return existsSync(f) && !/^\s*export\s+const\s+_sheo_stub\b/m.test(readFileSync(f, "utf8"));
}

// ---------------------------------------------------------------- the scope: what the documents reference

// The one reader of what the documents reference (.nirnroot/scope.json, which nirnroot's seed-tree writes
// from them and sends with them): for kind "node", "shape" or "fixture", the entry of `id` (null if it has
// none), or with no id the ids there are. A Node's entry: parent, children, its paths (code,
// internal-tests, forwarder, edge-tests) and per role (impl, edge, fixture) the shapes its agent sees and
// the fixtures its documents list; a shape's: its closure and its paths (code, tests); a fixture
// document's: its Node and its files (code, tests). No file (a project that predates it): null, always,
// and the callers keep what they did without it. One that isn't JSON breaks the bridge, never a guess.
// Everything else reads the documents' references through this function only.
const SCOPE = path.join(".nirnroot", "scope.json");
let scope = null;
function scoped(kind, id) {
  if (scope === null) {
    scope = {};
    if (existsSync(SCOPE)) {
      let doc;
      try {
        doc = JSON.parse(readFileSync(SCOPE, "utf8"));
      } catch (e) {
        throw new Error(`${SCOPE}: not JSON (${e.message})`);
      }
      if (!doc || typeof doc !== "object" || !["nodes", "shapes", "fixtures"].every((k) => doc[k] && typeof doc[k] === "object")) {
        throw new Error(`${SCOPE}: not nirnroot's scope (nodes, shapes, fixtures)`);
      }
      scope = doc;
    }
  }
  if (!scope.nodes) return null;
  const table = scope[`${kind}s`];
  return id === undefined ? Object.keys(table).sort() : (table[id] ?? null);
}

// Whether owner (a file, or a folder with a trailing /) holds p.
function covers(owner, p) {
  const o = owner.replace(/\/+$/, ""), q = p.replace(/\/+$/, "");
  return q === o || (owner.endsWith("/") && q.startsWith(`${o}/`));
}
const held = (owners, p) => owners.some((o) => covers(o, p));

// The Node whose code a path (an id, a pattern) is: the scope's, else the layout's (src/<id>/).
function codeNode(p) {
  const q = `${p.split(path.sep).join("/").replace(/\/+$/, "")}/`;
  if (scoped("node") !== null) {
    return scoped("node").find((n) => scoped("node", n).code.map((c) => `${c.replace(/\/+$/, "")}/`).includes(q)) ?? null;
  }
  const m = /^src\/([^/]+)\/$/.exec(q);
  return m ? m[1] : null;
}

function filesIn(paths, keep) {
  const out = [];
  for (const p of paths) {
    const at = p.replace(/\/+$/, "") || ".";
    if (!existsSync(at)) continue;
    if (statSync(at).isFile()) {
      if (keep(at)) out.push(path.normalize(at));
      continue;
    }
    for (const name of readdirSync(at).sort()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...filesIn([path.join(at, name)], keep));
    }
  }
  return unique(out.map((f) => f.split(path.sep).join("/")));
}

const STUB = /^\s*export\s+const\s+_sheo_stub\b/m;
const PENDING = /^\s*export\s+const\s+_sheo_pending\b/m;
const carries = (f, re) => re.test(readFileSync(f, "utf8"));

// Why a part isn't implemented, or [] when it is (checked statically, nothing run): its code (null: not
// asked) is there and no module of it still exports `_sheo_stub`; its tests (null: not asked) hold at least
// one test file, and none still exports `_sheo_pending` (the seeded pending test). The one definition of
// "implemented", for every kind of part.
function unfinished(code, tests) {
  const why = [];
  if (code !== null) {
    const modules = filesIn(code, (f) => /\.m?js$/.test(f));
    const stubs = modules.filter((f) => carries(f, STUB));
    if (!modules.length) why.push(`no code under ${code.join(", ")}`);
    else if (stubs.length) why.push(`${stubs.join(", ")} still carries _sheo_stub (the seeded placeholder)`);
  }
  if (tests !== null) {
    const files = filesIn(tests, (f) => f.endsWith(".test.mjs"));
    const pending = files.filter((f) => carries(f, PENDING));
    if (!files.length) why.push(`no test file under ${tests.join(", ")}`);
    else if (pending.length) why.push(`${pending.join(", ")} is still the seeded pending test (_sheo_pending)`);
  }
  return why;
}

// What a Node's promotion needs implemented, as [what, id, its agent, code, tests]: the Node's own code and
// its own edge test; each direct child's code and edge test (a child's own promotion held its children to
// the same); each shape its implementer's and its tester's documents give them, with the shapes those
// contain; each fixture its ITDs and EETs list. Not a fixture's instantiated Nodes. The one place that
// says how far `ready` looks.
function references(node) {
  const n = scoped("node", node);
  const out = [["its own code", node, `n-${node}`, n.code, null]];
  if (n.parent !== null) out.push(["its own edge test", node, `t-${node}`, null, n["edge-tests"]]);
  for (const c of n.children) {
    const child = scoped("node", c) ?? { code: [], "edge-tests": [] };
    out.push(["child", c, `n-${c}`, child.code, null], ["child's edge test", c, `t-${c}`, null, child["edge-tests"]]);
  }
  const roles = ["impl", "edge"].filter((r) => n[r]).map((r) => n[r]);
  for (const s of unique(roles.flatMap((r) => r.shapes)).sort()) {
    const shape = scoped("shape", s) ?? { code: [], tests: [] };
    out.push(["shape", s, `s-${s}`, shape.code, shape.tests]);
  }
  for (const f of unique(roles.flatMap((r) => r.fixtures)).sort()) {
    const fx = scoped("fixture", f) ?? { code: [], tests: [] };
    out.push(["fixture", f, `f-${f.split("/")[0]}`, fx.code, fx.tests]);
  }
  return out;
}

// One line per part the Node references that isn't implemented, naming it and its agent.
function notReady(node) {
  const out = [];
  for (const [what, id, agent, code, tests] of references(node)) {
    const why = unfinished(code, tests);
    if (why.length) out.push(`${what} ${id} (${agent}): ${why.join("; ")}`);
  }
  return out;
}

const PREDATES = `${SCOPE} isn't in this checkout (the project predates it; nirnroot's seed-tree writes it): what `
  + "the documents reference isn't checked, and the lint keeps the layout's rules.";

// `ready`: for each id (a Node's code), whether every part its documents reference is implemented in this
// checkout (the tree being promoted: the target, with the group's work in).
function readyFiles(ids) {
  const tests = [];
  let says = [];
  for (const i of unique(ids)) {
    if (scoped("node") === null) {
      tests.push({ id: i, status: "passed", message: PREDATES });
      says = [PREDATES];
      continue;
    }
    const node = codeNode(i);
    if (node === null || scoped("node", node) === null) {
      tests.push({ id: i, status: "error",
                   message: `${i} is no Node's code in ${SCOPE}: is it behind the tree? nirnroot's seed-tree writes it` });
      continue;
    }
    const lines = notReady(node);
    if (!lines.length) {
      tests.push({ id: i, status: "passed" });
      continue;
    }
    const text = `${node} isn't ready to promote: what its documents reference must be implemented in the tree `
      + "promoted (on the target already, or in this staging group), and isn't:\n- " + lines.join("\n- ")
      + "\nEach is the named agent's work, not this Node's: its ticket goes in this staging group, or in a group "
      + "this one waits on (wabbajack_staging's waits), and the promotion is retried once it is in. Shapes, "
      + "fixtures and children are promoted before the Nodes that use them (bottom-up).";
    // sheo-check gives the agent each failed test's first line, then this bridge's agent text: the record's
    // first line is the parts in short, so the text (in full) doesn't say its own first line twice.
    const parts = lines.map((l) => l.split(": ")[0]).join("; ");
    tests.push({ id: i, status: "failed",
                 message: `${node}: not implemented yet: ${parts}\n- ${lines.join("\n- ")}`.slice(0, CAP) });
    says.push(text);
  }
  const failed = tests.filter((t) => t.status !== "passed");
  // An error's record is one line, and sheo-check shows it already: the agent text adds only what is more.
  const agent = says.join("\n\n").slice(0, 6 * CAP);
  console.log(JSON.stringify({ tests, agent, log: LOG }));
  return failed.length ? 1 : 0;
}

// `tested`'s part: the code of the shape or fixture a test file is of, still carrying `_sheo_stub` (the
// scope's files for it, else the layout's: shapes/<id>/ for tests/shapes/<id>/, the modules of
// tests/fixtures/<id>/ that aren't tests).
function ownStub(id) {
  const t = id.split(path.sep).join("/");
  if (scoped("shape") !== null) {
    for (const kind of ["shape", "fixture"]) {
      for (const x of scoped(kind)) {
        const e = scoped(kind, x);
        if (held(e.tests, t)) return filesIn(e.code, (f) => /\.m?js$/.test(f)).filter((f) => carries(f, STUB));
      }
    }
    return [];
  }
  let m;
  if ((m = /^tests\/shapes\/([^/]+)\//.exec(t))) return filesIn([`shapes/${m[1]}/`], (f) => /\.m?js$/.test(f)).filter((f) => carries(f, STUB));
  if ((m = /^tests\/fixtures\/([^/]+)\//.exec(t))) {
    return filesIn([`tests/fixtures/${m[1]}/`], (f) => /\.m?js$/.test(f) && !f.endsWith(".test.mjs")).filter((f) => carries(f, STUB));
  }
  return [];
}

// Why a Node's own code is still the seeded placeholder, or []: the scope's code for it, else the layout's.
function placeholder(node) {
  const n = scoped("node", node);
  if (n) return unfinished(n.code, null);
  return implemented(node) ? [] : [`src/${node}/index.mjs still carries _sheo_stub (the seeded placeholder)`];
}

// The Node a test file is a test of, or null (a shape's test, say).
function subject(id) {
  const m = /^tests\/(?:internal|edges)\/([^/]+)\//.exec(id.split(path.sep).join("/"));
  return m ? m[1] : null;
}

// What a commit is held to (see the top): each result as `run` gives it, then those not held made
// `skipped`, with why. `marked`: the Nodes whose code the agent's patterns name (commit-get's ids): the Node
// committing; with none (criteria from before commit-get), the Node whose tests are here and whose
// parent's aren't. Returns the lines for the agent.
function commitRule(tests, marked) {
  const up = parents();
  const subjects = unique(tests.map((t) => subject(t.id)).filter(Boolean));
  const own = new Set(marked.length ? marked : subjects.filter((n) => !subjects.includes(up.get(n))));
  const says = [];
  const placeholders = new Set();
  for (const t of tests) {
    const node = subject(t.id);
    if (!node) continue;
    const bad = t.status === "failed" || t.status === "error";
    if (!marked.length && own.has(node) && placeholder(node).length) {
      placeholders.add(node);
      Object.assign(t, { status: "failed",
                         message: `src/${node}/index.mjs is still the seeded placeholder: ${node} isn't implemented` });
      continue;
    }
    if (!bad) continue;
    if (own.has(node)) {
      const waits = below(node, up).filter((n) => placeholder(n).length);
      says.push(`${t.id} fails now. It isn't held against this commit: it is at the merge`
                + (waits.length ? `, with ${waits.join(", ")} implemented (not yet)` : "")
                + `. Read why: your code, your test, or a Node below may be wrong; fix what is yours.\n${t.message || ""}`);
      Object.assign(t, { status: "skipped", message: `told, not held: ${t.message || ""}`.slice(0, CAP) });
    } else {
      says.push(`${t.id} (a test of ${node}, a Node below yours) fails now. It isn't held against this commit: `
                + `it is at the merge.\n${t.message || ""}`);
      Object.assign(t, { status: "skipped", message: `told, not held (a Node below): ${t.message || ""}`.slice(0, CAP) });
    }
  }
  for (const node of placeholders) says.unshift(`${node} isn't implemented: src/${node}/index.mjs is still the seeded placeholder.`);
  for (const node of [...own].sort()) {
    if (scoped("node", node) === null) continue;
    const lines = notReady(node).filter((x) => !x.startsWith("its own code "));
    if (lines.length) {
      says.push(`Told, not held: ${node}'s promotion will need these implemented, on the target or in its staging `
                + "group (the `ready` check holds it then); none is this commit's to fix:\n- " + lines.join("\n- "));
    }
  }
  return says;
}

// commit's ids that are a Node's code (commit-get's): each one's record (its code no longer the
// placeholder, held), and the Nodes.
function markerRecords(ids) {
  const out = [], nodes = [];
  for (const i of ids) {
    const node = codeNode(i);
    const why = placeholder(node);
    out.push(why.length ? { id: i, status: "failed", message: `${node} isn't implemented: ${why.join("; ")}`.slice(0, CAP) }
                        : { id: i, status: "passed" });
    nodes.push(node);
  }
  return [out, nodes];
}

// ---------------------------------------------------------------- lint

// The project's files a lint looks at: the modules under these paths.
function modulesUnder(p) {
  const at = p.replace(/\/+$/, "") || ".";
  if (!existsSync(at)) return [];
  if (statSync(at).isFile()) return /\.m?js$/.test(at) ? [path.normalize(at)] : [];
  const out = [];
  for (const name of readdirSync(at).sort()) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    out.push(...modulesUnder(path.join(at, name)));
  }
  return out;
}

const posix = (p) => p.split(path.sep).join("/");
const within = (p, dir) => p.startsWith(dir.endsWith("/") ? dir : `${dir}/`);

// What a module may import from the project, as the documents give it (the scope): {says, ok}, or null for
// a module in no part's folder (edges/, tools/, bin/). By folder: a Node's code imports its own folder, its
// direct children's call sites and the shapes its implementer's documents give it; its internal tests,
// their own folder, its code, its own and its children's call sites, those shapes and the fixtures its
// ITDs list; its edge's tests, their own folder, its call site (never its code), the shapes and fixtures
// its EETs give; its fixtures, their own folder, its children's call sites and the shapes its fixture
// agent's documents give; a shape and its tests, the shapes of its closure (and the tests their own folder).
function scopeRule(file) {
  const code = (kind, ids) => ids.flatMap((i) => scoped(kind, i)?.code ?? []);
  const sites = (ids) => ids.flatMap((i) => scoped("node", i)?.forwarder ?? []);
  const list = (xs) => xs.join(", ") || "none";
  const fix = "A shape or fixture its code needs that its documents don't list: list it in the document, then the "
    + "operator publishes it and runs seed-tree; never a way round the rule.";
  for (const node of scoped("node")) {
    const n = scoped("node", node);
    const impl = n.impl, edge = n.edge ?? { shapes: [], fixtures: [] }, kids = n.children;
    let ok, says;
    if (held(n.code, file)) {
      ok = [...n.code, ...sites(kids), ...code("shape", impl.shapes)];
      says = `${node}'s code imports its own folder, its children's call sites (${list(sites(kids))}) and the shapes `
        + `its documents give it (${list(impl.shapes)}) only`;
    } else if (held(n["internal-tests"], file)) {
      ok = [...n["internal-tests"], ...n.code, ...n.forwarder, ...sites(kids), ...code("shape", impl.shapes),
            ...code("fixture", impl.fixtures)];
      says = `an internal test of ${node} imports its own folder, ${node}'s code, its call site and its children's `
        + `(${list(sites(kids))}), the shapes its documents give it (${list(impl.shapes)}) and the fixtures its ITDs `
        + `list (${list(impl.fixtures)}) only`;
    } else if (held(n["edge-tests"], file)) {
      ok = [...n["edge-tests"], ...n.forwarder, ...code("shape", edge.shapes), ...code("fixture", edge.fixtures)];
      says = `an edge's test reaches ${node} only through its call site (${list(n.forwarder)}), never its code; it `
        + `imports its own folder, the shapes its EETs give it (${list(edge.shapes)}) and the fixtures they list `
        + `(${list(edge.fixtures)}) besides`;
    } else if (n.fixture && held(n.fixture.code, file)) {
      ok = [...n.fixture.code, ...sites(kids), ...code("shape", n.fixture.shapes)];
      says = `${node}'s fixtures import their own folder, ${node}'s children's call sites (${list(sites(kids))}) and `
        + `the shapes their documents give them (${list(n.fixture.shapes)}) only: never a Node's code, another `
        + `fixture, or ${node}'s own call site`;
    } else continue;
    return { says: `${says}. ${fix}`, ok: (t) => held(ok, t) };
  }
  for (const shape of scoped("shape")) {
    const e = scoped("shape", shape);
    const test = held(e.tests, file);
    if (held(e.code, file) || test) {
      const ok = [...code("shape", e.closure), ...(test ? e.tests : [])];
      return { says: `the shape ${shape} and its tests import the shapes it is made of (${list(e.closure)})`
                 + `${test ? " and their own folder" : ""} only. ${fix}`, ok: (t) => held(ok, t) };
    }
  }
  return null;
}

// What a module of the layout may import from the project (packages and node's own aside), or null: no rule.
// From the scope where the checkout has it (scopeRule); else from the layout and tree.json, as before it.
function importRule(file) {
  if (scoped("node") !== null) return scopeRule(file);
  let m;
  if ((m = /^src\/([^/]+)\//.exec(file))) {
    const id = m[1];
    return { says: `src/${id}/ imports its own folder, its children's call sites (edges/edge_to_<child>.mjs, `
                   + "a child as .nirnroot/docs/tree.json has it) and shapes/ only",
             ok: (t) => within(t, `src/${id}`) || within(t, "shapes")
               || (callSiteOf(t) !== null && parents().get(callSiteOf(t)) === id) };
  }
  if ((m = /^shapes\/[^/]+\//.exec(file))) {
    return { says: "a shape imports shapes/ only", ok: (t) => within(t, "shapes") };
  }
  if ((m = /^tests\/edges\/([^/]+)\//.exec(file))) {
    const id = m[1];
    return { says: `an edge's test reaches ${id} only through its call site (edges/edge_to_${id}.mjs), `
                   + `never src/; it imports its own folder, shapes/ and the fixtures of ${id}'s ancestors `
                   + "(tests/fixtures/<ancestor>/, as .nirnroot/docs/tree.json has them) besides",
             ok: (t) => within(t, `tests/edges/${id}`) || within(t, "shapes") || t === `edges/edge_to_${id}.mjs`
               || (fixtureOf(t) !== null && ancestors(id, parents()).includes(fixtureOf(t))) };
  }
  if ((m = /^tests\/internal\/([^/]+)\//.exec(file))) {
    const id = m[1];
    return { says: `an internal test of ${id} imports its own folder, src/${id}/, ${id}'s call site and its `
                   + "children's (edges/edge_to_<child>.mjs, a child as .nirnroot/docs/tree.json has it), shapes/ "
                   + `and the fixtures of ${id}'s ancestors (tests/fixtures/<ancestor>/) only: never another `
                   + "Node's code or call site",
             ok: (t) => within(t, `tests/internal/${id}`) || within(t, `src/${id}`) || within(t, "shapes")
               || t === `edges/edge_to_${id}.mjs`
               || (callSiteOf(t) !== null && parents().get(callSiteOf(t)) === id)
               || (fixtureOf(t) !== null && ancestors(id, parents()).includes(fixtureOf(t))) };
  }
  if ((m = /^tests\/shapes\/([^/]+)\//.exec(file))) {
    const id = m[1];
    return { says: "a shape's test imports its own folder and shapes/ only",
             ok: (t) => within(t, `tests/shapes/${id}`) || within(t, "shapes") };
  }
  if ((m = /^tests\/fixtures\/([^/]+)\//.exec(file))) {
    const id = m[1];
    return { says: `${id}'s fixtures import their own folder, shapes/ and ${id}'s children's call sites `
                   + "(edges/edge_to_<child>.mjs, a child as .nirnroot/docs/tree.json has it) only: never src/, "
                   + `never another Node's fixtures, never ${id}'s own call site`,
             ok: (t) => within(t, `tests/fixtures/${id}`) || within(t, "shapes")
               || (callSiteOf(t) !== null && parents().get(callSiteOf(t)) === id) };
  }
  return null;
}

const ASSERTS = /\b(?:assert(?:\.[A-Za-z]+)?|ok|equal|notEqual|strictEqual|notStrictEqual|deepEqual|notDeepEqual|deepStrictEqual|notDeepStrictEqual|match|doesNotMatch|throws|doesNotThrow|rejects|doesNotReject|fail|ifError)\s*\(/;

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

function packageName(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

// One module: it parses, each import resolves (a relative path to a file there, a package installed, node's
// own), the names it imports from the project exist, no import is absolute, its folder's import rule holds,
// and a test file asserts something. Problems in what it imports are those files' own, not its.
async function lintFile(esbuild, builtins, file) {
  const problems = [];
  const rel = posix(path.normalize(file));
  const entry = path.resolve(file);
  const rule = importRule(rel);
  const src = readFileSync(file, "utf8");
  if (rel.endsWith(".test.mjs") && !/^\s*export\s+const\s+_sheo_pending\b/m.test(src)
      && !ASSERTS.test(stripComments(src))) {
    problems.push("a test file that asserts nothing: it can't fail (node:assert's calls, none here)");
  }
  const plugin = { name: "sheo-lint", setup(build) {
    build.onResolve({ filter: /.*/ }, (a) => {
      if (a.kind === "entry-point") return undefined;
      if (a.importer !== entry) return { path: a.path, external: true };   // a dependency's own imports: its own
      const spec = a.path;
      if (spec.startsWith("/") || /^[A-Za-z]:[\\/]/.test(spec) || spec.startsWith("file:")) {
        problems.push(`imports "${spec}": an absolute path, which resolves only where it was written; `
                      + "import by a relative path");
        return { path: spec, external: true };
      }
      if (spec.startsWith(".")) {
        const target = path.resolve(a.resolveDir, spec);
        const t = posix(path.relative(process.cwd(), target));
        if (!existsSync(target) || !statSync(target).isFile()) {
          problems.push(`imports "${spec}", which is no file (${t}): check the path from ${path.dirname(rel)}/`
                        + " and its extension");
          return { path: spec, external: true };
        }
        if (rule && !rule.ok(t)) problems.push(`imports ${t}: ${rule.says}`);
        if (a.kind !== "import-statement" || !/\.m?js$/.test(target)) return { path: spec, external: true };
        return { path: target };
      }
      if (builtins.has(spec) || spec.startsWith("node:")) return { path: spec, external: true };
      if (!existsSync(path.join("node_modules", packageName(spec), "package.json"))) {
        problems.push(`imports "${spec}": no such package is installed (the project's are fixed)`);
      }
      return { path: spec, external: true };
    });
  } };
  // Parsing is Node's own (what it refuses to load); esbuild is asked only what a bundler can tell that Node
  // would only find on loading: an import that doesn't resolve, a name the imported file doesn't export.
  const parsed = spawnSync(process.execPath, ["--check", entry], { encoding: "utf8" });
  if (parsed.status !== 0) {
    const text = (parsed.stderr || "").split("\n").filter((l) => l.trim() && !/^\s+at /.test(l) && !/^Node\.js v/.test(l));
    problems.push(`doesn't parse: ${text.join(" | ").replace(entry, rel)}`);
    return unique(problems);
  }
  try {
    await esbuild.build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node",
                          logLevel: "silent", plugins: [plugin] });
  } catch (e) {
    for (const x of e?.errors || []) {
      const at = x.location?.file ? path.resolve(x.location.file) : entry;
      if (at !== entry || !/No matching export|Could not resolve/.test(x.text)) continue;
      problems.push(`${x.location?.line ? `line ${x.location.line}: ` : ""}${x.text}`);
    }
  }
  return unique(problems);
}

async function lintFiles(ids) {
  const files = unique(ids.map((i) => path.normalize(i)));
  const log = (s) => appendFileSync(LOG, s.endsWith("\n") ? s : `${s}\n`);
  let esbuild;
  try {
    const m = await import(pathToFileURL(path.resolve("node_modules", "esbuild/lib/main.js")).href);
    esbuild = m.default ?? m;
  } catch (e) {
    throw new Error(`lint needs the project's esbuild, which its setup installs: ${String(e?.message || e).split("\n")[0]}`);
  }
  const { builtinModules } = await import("node:module");
  const builtins = new Set(builtinModules);
  parents();   // read the tree and the scope here: inside esbuild's plugin, a file that isn't JSON would be swallowed
  scoped("node");
  const tests = [];
  for (const id of files) {
    if (!existsSync(id)) {
      tests.push({ id, status: "error", message: "no such file" });
      continue;
    }
    const problems = await lintFile(esbuild, builtins, id);
    if (problems.length) {
      log(`LINT ${id}\n${problems.join("\n")}`);
      tests.push({ id, status: "failed", message: problems.join("\n").slice(0, CAP) });
    } else {
      tests.push({ id, status: "passed" });
    }
  }
  await esbuild.stop?.();
  const failed = tests.filter((t) => t.status !== "passed");
  let agent = failed.length ? `${failed.length} file(s) failed lint, which holds every commit: `
                              + `${failed.slice(0, 10).map((t) => t.id).join(", ")}.` : "";
  const why = failed.map((t) => `${t.id}:\n${t.message}`).join("\n\n");
  if (why) agent = `${agent}\n\n${why}`.slice(0, 6 * CAP);
  console.log(JSON.stringify({ tests, agent, log: LOG }));
  return failed.length ? 1 : 0;
}

// Each test file run, as its record: what `run`, `written` and `tested` give for it. Prints nothing: runFiles
// prints them; a check may make them into records of its own.
async function fileRecords(files, written = false, tested = false) {
  const per = new Map(files.map((f) => [f, { fails: [], passed: 0, skipped: 0, duration: 0, stderr: "",
                                              wrapper: null }]));
  const log = (s) => appendFileSync(LOG, s.endsWith("\n") ? s : `${s}\n`);
  const here = files.filter((f) => existsSync(f));
  const inPage = here.filter(isBrowser);
  const present = here.filter((f) => !isBrowser(f));
  if (inPage.length) await runBrowserFiles(inPage, per, log);
  if (present.length) {
    const stream = run({ files: present.map((f) => path.resolve(f)), timeout: TIMEOUT, concurrency: true,
                         forceExit: true });
    for await (const { type, data } of stream) {
      const rec = data?.file ? per.get(path.relative(process.cwd(), data.file)) : undefined;
      if (type === "test:stdout" || type === "test:stderr" || type === "test:diagnostic") {
        log(String(data.message ?? ""));
        if (rec && type === "test:stderr") rec.stderr = (rec.stderr + String(data.message ?? "")).slice(-CAP);
        continue;
      }
      if ((type !== "test:pass" && type !== "test:fail") || data.nesting !== 0 || !rec) continue;
      if (data.file && path.resolve(String(data.name)) === path.resolve(data.file)) {
        // the file itself, as node reports it when it defines no test or fails to load
        rec.wrapper = type === "test:fail" ? message(data.details?.error) : "passed";
        continue;
      }
      rec.duration += (data.details?.duration_ms || 0) / 1000;
      if (type === "test:fail") {
        const m = message(data.details?.error);
        rec.fails.push({ name: data.name, message: m });
        log(`FAIL ${data.file} > ${data.name}\n${m}`);
      } else if (data.skip || data.todo) {
        rec.skipped += 1;
      } else {
        rec.passed += 1;
      }
    }
  }
  const tests = files.map((id) => {
    const r = per.get(id);
    const duration = Math.round(r.duration * 1000) / 1000;
    if (!existsSync(id)) return { id, status: "error", message: "no such test file" };
    if (written) {
      if (r.fails.length || r.passed) {
        const red = r.fails.map((f) => `${f.name}: ${head(f.message)}`).join("\n");
        return r.fails.length
          ? { id, status: "passed", duration, red: r.fails.length,
              message: `written; red, ${r.fails.length} failing:\n${red}`.slice(0, CAP) }
          : { id, status: "passed", duration };
      }
      if (r.wrapper && r.wrapper !== "passed") {
        return { id, status: "error", duration,
                 message: `not written: the file failed to load:\n${r.stderr.trim() || r.wrapper}`.slice(0, CAP) };
      }
      return { id, status: "failed", duration,
               message: r.skipped ? "not written: every test in it is skipped (the pending test is still there)"
                                  : "not written: the file defines no test" };
    }
    if (r.fails.length) {
      const text = r.fails.map((f) => `${f.name}: ${head(f.message)}`).join("\n");
      return { id, status: "failed", duration, message: text.slice(0, CAP) };
    }
    if (r.wrapper && r.wrapper !== "passed") {
      return { id, status: "error", duration,
               message: `the file failed to load, or exited non-zero:\n${r.stderr.trim() || r.wrapper}`.slice(0, CAP) };
    }
    if (r.passed) return { id, status: "passed", duration };
    if (r.skipped && tested) {
      return { id, status: "failed", duration,
               message: "not written: every test in it is skipped (the pending test is still there)" };
    }
    if (r.skipped) return { id, status: "skipped", duration };
    return { id, status: "error", duration, message: "no test ran: the file defines none, or didn't load" };
  });
  for (const t of tested ? tests : []) {
    const stub = ownStub(t.id);
    if (stub.length) {
      Object.assign(t, { status: "failed",
                         message: (`${stub.join(", ")} still carries _sheo_stub: the code these tests are of is still `
                                   + "marked the seeded placeholder; remove the marker once it is implemented"
                                   + (t.message ? `\n${t.message}` : "")).slice(0, CAP) });
    }
  }
  return tests;
}

async function runFiles(ids, written = false, commit = false, tested = false) {
  let files = unique(ids.map((i) => path.normalize(i)));
  let marks = [], marked = [];
  if (commit || tested) {
    parents();   // read the tree and the scope before running anything: one that isn't JSON breaks the bridge
    scoped("node");
  }
  if (commit) {
    const codes = unique(ids).filter((i) => !(existsSync(i) && statSync(i).isFile()) && codeNode(i) !== null);
    files = files.filter((f) => !codes.map((c) => path.normalize(c)).includes(f));
    [marks, marked] = markerRecords(codes);
  }
  const tests = await fileRecords(files, written, tested);
  const told = commit ? commitRule(tests, marked) : [];
  tests.unshift(...marks);
  const failed = tests.filter((t) => t.status === "failed" || t.status === "error").map((t) => t.id);
  const red = tests.filter((t) => t.red);
  let agent = written
    ? [failed.length ? `${failed.length} test file(s) not written: ${failed.slice(0, 10).join(", ")}.` : "",
       red.length ? `Written, and red (failing now): ${red.slice(0, 10).map((t) => `${t.id} (${t.red})`).join(", ")}. `
                    + "That is expected of a test written before the code it tests, and doesn't fail this check: "
                    + "make sure each fails for the reason you mean (the code isn't written), not for a mistake "
                    + `in the test. Full log: ${LOG}.` : ""].filter(Boolean).join(" ")
    : [failed.length ? `${failed.length} test file(s) failed: ${failed.slice(0, 10).join(", ")}. Full log: ${LOG}.` : "",
       ...told.slice(0, 10)].filter(Boolean).join("\n").slice(0, 4 * CAP);
  for (const t of tests) delete t.red;
  // Why each failed, in the text the agent is given: a caller may show it only the first line of a test's message.
  const why = tests.filter((t) => (t.status === "failed" || t.status === "error") && t.message)
    .map((t) => `${t.id}:\n${t.message}`).join("\n\n");
  if (why) agent = `${agent}\n\n${why}`.slice(0, 6 * CAP);
  console.log(JSON.stringify({ tests, agent, log: LOG }));
  return failed.length ? 1 : 0;
}

// ready-under's ids: every Node's code under these folders (the folders, with none).
function nodesUnder(dirs) {
  const codes = scoped("node") === null ? [] : unique(scoped("node").flatMap((n) => scoped("node", n).code)
    .filter((c) => dirs.some((d) => covers(`${d.replace(/\/+$/, "")}/`, c))));
  return codes.length ? codes : dirs.map((d) => `${d.replace(/\/+$/, "")}/`);
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === "get") {
    console.log(JSON.stringify({ tests: unique(rest.flatMap(filesUnder)).map((id) => ({ id })) }));
    return 0;
  }
  if (cmd === "ready-get" || cmd === "commit-get") {
    // A pattern that is a Node's code is that Node's one id (commit's: with the test files under the rest).
    const codes = unique(rest.filter((p) => codeNode(p) !== null));
    const tests = cmd === "commit-get" ? unique(rest.flatMap(filesUnder)) : [];
    console.log(JSON.stringify({ tests: [...codes, ...tests].map((id) => ({ id })) }));
    return 0;
  }
  if (cmd === "ready") return readyFiles(rest);
  if (cmd === "ready-under") return readyFiles(nodesUnder(rest));
  if (cmd === "run-under") return runFiles(unique(rest.flatMap(filesUnder)));
  if (cmd === "run") return runFiles(rest);
  if (cmd === "written-under") return runFiles(unique(rest.flatMap(filesUnder)), true);
  if (cmd === "written") return runFiles(rest, true);
  if (cmd === "commit-under") return runFiles(unique(rest.flatMap(filesUnder)), false, true);
  if (cmd === "commit") return runFiles(rest, false, true);
  if (cmd === "tested-under") return runFiles(unique(rest.flatMap(filesUnder)), false, false, true);
  if (cmd === "tested") return runFiles(rest, false, false, true);
  if (cmd === "lint-get") {
    console.log(JSON.stringify({ tests: unique(rest.flatMap(modulesUnder)).map((id) => ({ id })) }));
    return 0;
  }
  if (cmd === "lint-under") return lintFiles(unique(rest.flatMap(modulesUnder)));
  if (cmd === "lint") return lintFiles(rest);
  process.stderr.write("usage: sheo-bridge.mjs run-under DIR... | run ID... | get PATH... | "
                       + "written-under DIR... | written ID... | commit-get PATH... | commit-under DIR... | commit ID... | "
                       + "tested-under DIR... | tested ID... | ready-get PATH... | ready-under DIR... | ready ID... | "
                       + "lint-get PATH... | lint-under DIR... | lint ID...\n");
  return 2;
}

main(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; },
  (err) => { process.stderr.write(`sheo-bridge: ${err?.stack || err}\n`); process.exitCode = 3; },
);
