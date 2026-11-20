#!/usr/bin/env python3
"""nirnroot-map for a Node.js project (docs/bridges.md), in nirnroot's
Node profile: `seed-init --profile node` puts it in .nirnroot/bridges/;
copy it to make it yours. It runs where nirnroot runs (Python), not in the
dev container.

The layout it gives, flat so no Node's paths hold another's:

    src/<id>/                     a Node's code (index.mjs: its surface)
    tests/internal/<id>/          its internal tests (*.test.mjs)
    edges/edge_to_<id>.mjs        the parent's call site for the Node (no
                                  parent in its name: the tree says it)
    tests/edges/<id>/             the edge's tests (*.test.mjs)
    shapes/<id>/                  an API Shape's code (index.mjs), imported
                                  by the Nodes that use it
    tests/shapes/<id>/            its tests (its implementer's)
    tests/fixtures/<id>/          a Node's fixtures (index.mjs: one object per
                                  fixture document, its Functions) and their
                                  tests, its fixture agent's
    package.json, package-lock.json, .gitignore, tools/sheo-bridge.mjs,
    bin/<project>.mjs             shared: the manifest (dependencies fixed:
                                  agents don't change them), sheo-check's
                                  runner bridge (node:test) and the launcher
                                  (the root Node's `main`, called: `npm start`)
    assets/                       the asset area: files nirnroot puts there
                                  (put through sheo-stack), seen by the agents whose
                                  documents list them

The categories it names (ready, shape, fixture, unit, edge, written,
commit) are
the ones the profile's sheo-stack.json defines. `shape` is a shape's
implementer's: its tests are written (the seeded pending one replaced) and
pass (the bridge's `tested`); `fixture` is a Node's fixture agent's, the
same. `written` is the edge tester's: its test
files load and hold a test that runs, whatever its result (the bridge's
`written`), so a test can be committed before the code that passes it.
`commit` is the implementer's, on a commit: its Node's tests and its
children's are run and told, none held, and its code must no longer be the
placeholder (the bridge's `commit`), so it waits on no child to work. `ready` is the
implementer's merge's alone (a promotion's): every part its documents
reference (.nirnroot/scope.json) is implemented in the tree promoted (the
bridge's `ready`); `commit` tells the same, holding none. The profile's `order` runs `ready` before every
category that runs tests (after `lint`; it reads files and runs no test): with stop-on-fail, a test that
reaches a stub would fail first and skip it, and the promotion would show a traceback, not the part
missing and its agent. The
implementer's merge is held to unit and edge, all of them; the tester's merge to edge. `lint` is everyone's (the top-level
`lint`): what each agent writes must parse, its imports resolve and keep to
the layout, and its test files assert something (the bridge's `lint`), on
every commit and at the merge.
"""

import json
import sys

SHARED = ["package.json", "package-lock.json", ".gitignore", "tools/sheo-bridge.mjs"]


def shared(project: str) -> list[str]:
    return SHARED + [f"bin/{project}.mjs"]


def paths(node: str, parent: str | None) -> dict:
    out = {"id": node, "code": [f"src/{node}/"], "internal-tests": [f"tests/internal/{node}/"],
           "edge": None,
           "checks": {"internal": {"categories": ["unit"], "patterns": [f"tests/internal/{node}/"]}, "edge": None}}
    if parent is not None:
        out["edge"] = {"forwarder": [f"edges/edge_to_{node}.mjs"], "tests": [f"tests/edges/{node}/"]}
        out["checks"]["edge"] = {"categories": ["edge"], "patterns": [f"tests/edges/{node}/"]}
        out["checks"]["written"] = {"categories": ["written"], "patterns": [f"tests/edges/{node}/"]}
    own = [f"tests/internal/{node}/"] + ([f"tests/edges/{node}/"] if parent is not None else [])
    # The Node's code first: the runner bridge's commit-get and ready-get turn it into the Node's own id.
    out["checks"]["commit"] = {"categories": ["commit"], "patterns": [f"src/{node}/"] + own}
    out["checks"]["ready"] = {"categories": ["ready"], "patterns": [f"src/{node}/"]}
    return out


def shape(s: str) -> dict:
    return {"id": s, "code": [f"shapes/{s}/"], "tests": [f"tests/shapes/{s}/"],
            "checks": {"categories": ["shape"], "patterns": [f"tests/shapes/{s}/"]}}


def fixture(node: str, documents: list[str]) -> dict:
    """A Node's fixtures' folder, and each fixture document's own files in
    it, as fs.py seeds them: the code of all of them is one index.mjs, the
    tests one <name>.test.mjs each."""
    docs = [{"id": f, "code": [f"tests/fixtures/{node}/index.mjs"],
             "tests": [f"tests/fixtures/{node}/{f.split('/', 1)[1]}.test.mjs"]}
            for f in documents if f.split("/")[0] == node]
    return {"id": node, "code": [f"tests/fixtures/{node}/"], "documents": docs,
            "checks": {"categories": ["fixture"], "patterns": [f"tests/fixtures/{node}/"]}}


def main() -> int:
    req = json.load(sys.stdin)
    if req.get("op") != "paths":
        return 2
    tree = req["tree"]
    nodes = req.get("nodes") or list(tree)
    print(json.dumps({"version": 1, "shared": shared(req["project"]), "assets": "assets/",
                      "lint": {"categories": ["lint"]},
                      "nodes": [paths(n, tree[n]["parent"]) for n in nodes],
                      "shapes": [shape(s) for s in req.get("shapes") or []],
                      "fixtures": [fixture(n, req.get("fixture-documents") or []) for n in req.get("fixtures") or []]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
