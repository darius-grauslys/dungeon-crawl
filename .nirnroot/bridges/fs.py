#!/usr/bin/env python3
"""nirnroot-fs for a Node.js project (docs/bridges.md), matching map.py
beside it, in nirnroot's Node profile. It runs where nirnroot runs
(Python) and writes JavaScript (ES modules).

`seed` gives, for each Node: a stub `src/<id>/index.mjs` whose functions
throw (and `export const _sheo_stub = true`, which the implementation
removes), the parent's forwarder (the Node's EED lowered: each Function
with the EED's text, calling the child's surface, nothing else), a pending edge test (`export const _sheo_pending = true` and a
skipped test, which the edge's tester replaces), and a `.keep` in the
internal tests' folder; for each shape, a stub class (`_sheo_stub`) and a
pending test, which the shape's implementer replaces; for each Node's
fixtures, one `tests/fixtures/<id>/index.mjs` exporting an object per
fixture document (named for it, one function per Function, each
throwing) and a pending test per document, which the fixture agent
replaces. With project-files: package.json and
package-lock.json (the dependencies fixed, seed/ beside this file, named
for the project), a .gitignore, sheo-check's runner bridge
(sheo-bridge.mjs beside this file, seeded as tools/sheo-bridge.mjs: the
project's from then on), and the launcher, `bin/<project>.mjs`: it
imports the root Node's surface and calls its `main` (`npm start`, or
`node bin/<project>.mjs [args]`), and says so and stops when the root
exports none. The root is the tree's (the Node with no parent), so the
launcher needs no EED and is never behind one; `main` is a convention of
this profile, not a rule of nirnroot's.

An EED function's name becomes a JavaScript identifier in camelCase
(`roll-many` -> `rollMany`).
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUNNER = HERE / "sheo-bridge.mjs"
SEED = HERE / "seed"
GITIGNORE = "node_modules/\n.sheo-check.log\nout/\n"


def ident(name: str) -> str:
    words = [w for w in re.split(r"[^A-Za-z0-9]+", name) if w]
    if not words:
        return "_"
    out = words[0][0].lower() + words[0][1:] + "".join(w[0].upper() + w[1:] for w in words[1:])
    return out if not out[0].isdigit() else f"_{out}"


def cls(name: str) -> str:
    i = ident(name)
    return i[0].upper() + i[1:]


def comment(text: str) -> str:
    return " ".join(text.split()).replace("*/", "* /")


def stub(node: dict) -> str:
    lines = [f"// {node['id']}: a stub, seeded by nirnroot. Its implementation replaces it.", "",
             "export const _sheo_stub = true;", ""]
    for f in node["functions"]:
        n = ident(f["name"])
        lines += [f"/** {comment(f.get('doc', ''))} */",
                  f"export function {n}(...args) {{",
                  f"  throw new Error(\"not implemented: {node['id']}.{n}\");", "}", ""]
    return "\n".join(lines)


def forwarder(node: dict) -> str:
    """The Node's EED, lowered: each Function with its EED text in a block
    nirnroot checks (docs/bridges.md), calling the Node's code. A call,
    not a re-export by name: a Function the EED has gained and the code
    doesn't export yet then fails when called, not when any importer of
    this file loads."""
    lines = [f"// The call site for {node['id']}: forwards to its surface, nothing else.",
             f"// {node['id']}'s EED, lowered by nirnroot, which keeps this file in step with it: no agent writes it.",
             ""]
    if not node["functions"]:
        return "\n".join(lines + [f"export * from \"../src/{node['id']}/index.mjs\";"]) + "\n"
    lines += [f"import * as target from \"../src/{node['id']}/index.mjs\";", ""]
    for f in node["functions"]:
        n = ident(f["name"])
        lines.append(f"// __nirnroot_begin__ {f['name']}")
        lines += [f"// {x}".rstrip() for x in f.get("doc", "").splitlines()]
        lines += ["// __nirnroot_end__",
                  f"export function {n}(...args) {{", f"  return target.{n}(...args);", "}", ""]
    return "\n".join(lines)


def edge_test(node: dict) -> str:
    return "\n".join([f"// The edge test for {node['id']}: pending until its tester writes it.", "",
                      'import { test } from "node:test";', "",
                      "export const _sheo_pending = true;", "",
                      'test.skip("pending", () => {});', ""])


def shape_test(s: dict) -> str:
    return "\n".join([f"// The tests of the shape {s['id']}: pending until its implementer writes them.", "",
                      'import { test } from "node:test";', "",
                      "export const _sheo_pending = true;", "",
                      'test.skip("pending", () => {});', ""])


def shape_stub(s: dict) -> str:
    fields = ", ".join(ident(f["name"]) for f in s.get("fields", [])) or "none"
    return "\n".join([f"// {s['id']}: an API Shape, a stub seeded by nirnroot. Its implementer replaces it.", "",
                      "export const _sheo_stub = true;", "",
                      f"/** Fields: {fields}. */",
                      f"export class {cls(s['id'])} {{",
                      "  constructor(...args) {",
                      f"    throw new Error(\"not implemented: shape {s['id']}\");",
                      "  }", "}", ""])


def fixture_stub(node: dict) -> str:
    """A Node's fixtures, stubbed: one exported object per fixture document,
    so two documents' Functions never collide (`table.fulfilled()`)."""
    lines = [f"// {node['id']}'s fixtures: stubs, seeded by nirnroot. Its fixture agent replaces them.", "",
             "export const _sheo_stub = true;", ""]
    for doc in node["documents"]:
        lines += [f"/** fixture {doc['id']} */", f"export const {ident(doc['name'])} = {{"]
        for f in doc["functions"]:
            n = ident(f["name"])
            lines += [f"  /** {comment(f.get('doc', ''))} */",
                      f"  {n}(...args) {{",
                      f"    throw new Error(\"not implemented: fixture {doc['id']}.{n}\");", "  },"]
        lines += ["};", ""]
    return "\n".join(lines)


def fixture_test(doc: dict) -> str:
    return "\n".join([f"// The tests of the fixture {doc['id']}: pending until its agent writes them.", "",
                      'import { test } from "node:test";', "",
                      "export const _sheo_pending = true;", "",
                      'test.skip("pending", () => {});', ""])


def launcher_path(project: str) -> str:
    return f"bin/{project}.mjs"


def launcher(project: str, root: str) -> str:
    """The program's launcher: the root Node's `main`, called. The root
    is read from the tree, never from a document: a root can't move, so
    this file is seeded once and never lowered again."""
    return "\n".join([
        "#!/usr/bin/env node",
        f"// {project}: the launcher, seeded by nirnroot's Node profile. It imports the root",
        f"// Node's surface (src/{root}/index.mjs) and calls its `main`; the root's EED says what",
        f"// `main` does. No agent writes this file. Run: `npm start -- [args]` or",
        f"// `node bin/{project}.mjs [args]`.",
        "",
        f"import * as root from \"../src/{root}/index.mjs\";",
        "",
        "if (typeof root.main !== \"function\") {",
        f"  console.error(\"{project}: the root Node `{root}` exports no `main`: give its EED a Function"
        " `main` and implement it\");",
        "  process.exitCode = 2;",
        "} else {",
        "  await root.main();",
        "}",
        "",
    ])


def manifest(project: str) -> tuple[str, str]:
    pkg = json.loads((SEED / "package.json").read_text())
    lock = json.loads((SEED / "package-lock.json").read_text())
    pkg["name"] = lock["name"] = project
    pkg["scripts"] = {"start": f"node {launcher_path(project)}"}
    lock["packages"][""]["name"] = project
    return json.dumps(pkg, indent=2) + "\n", json.dumps(lock, indent=2) + "\n"


def seed(req: dict) -> dict:
    files = []
    if req.get("project-files"):
        pkg, lock = manifest(req["project"])
        files += [{"path": "package.json", "content": pkg}, {"path": "package-lock.json", "content": lock},
                  {"path": ".gitignore", "content": GITIGNORE},
                  {"path": "tools/sheo-bridge.mjs", "content": RUNNER.read_text(), "executable": True}]
        roots = [n for n, x in req["tree"].items() if x.get("parent") is None]
        if len(roots) == 1:
            files.append({"path": launcher_path(req["project"]), "content": launcher(req["project"], roots[0]),
                          "executable": True})
    for node in req["nodes"]:
        p, n = node["paths"], node["id"]
        files.append({"path": f"src/{n}/index.mjs", "content": stub(node)})
        files.append({"path": f"tests/internal/{n}/.keep", "content": ""})
        if p.get("edge"):
            files.append({"path": p["edge"]["forwarder"][0], "content": forwarder(node)})
            files.append({"path": f"tests/edges/{n}/edge.test.mjs", "content": edge_test(node)})
    for node in req.get("forwarders") or []:     # a seeded Node's forwarder alone: its EED changed
        files.append({"path": node["paths"]["edge"]["forwarder"][0], "content": forwarder(node)})
    for s in req.get("shapes") or []:
        files.append({"path": f"shapes/{s['id']}/index.mjs", "content": shape_stub(s)})
        files.append({"path": f"tests/shapes/{s['id']}/{s['id']}.test.mjs", "content": shape_test(s)})
    for node in req.get("fixtures") or []:
        files.append({"path": f"tests/fixtures/{node['id']}/index.mjs", "content": fixture_stub(node)})
        for doc in node["documents"]:
            files.append({"path": f"tests/fixtures/{node['id']}/{doc['name']}.test.mjs", "content": fixture_test(doc)})
    return {"version": 1, "files": files}


def main() -> int:
    req = json.load(sys.stdin)
    if req.get("op") != "seed":
        return 2
    print(json.dumps(seed(req)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
