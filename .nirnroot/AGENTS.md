# .nirnroot

This project's program tree is managed by nirnroot. Everything under
`.nirnroot/` is nirnroot's: only nirnroot writes it, on the
`__nirnroot` branch, and merges it to main. No sheo-stack agent may
change it, and no ticket or staging group targets `__nirnroot`. A change
to it on main is overwritten from `__nirnroot` at nirnroot's next
seed. The project's asset area (where nirnroot's map says, `assets/`
say) holds the program's files that no agent writes: nirnroot seeds an
empty placeholder for each one its documents list, the real file goes
over it on main through sheo-stack (wabbajack's `repo-put`), and the
documents say which agents see each.

- `docs/`: the tree (`tree.json`) and its documents: each Node's EED,
  EETs, ISDs, ITDs and fixtures, and the shapes.
- `agent-rules.md`: the rules that open every agent's prompt.
- `nirnroot.json` and `bridges/`: how nirnroot maps the tree onto this
  project's files (the end user's bridges).
- `state.json`: what nirnroot has seeded (Nodes, shapes and fixtures,
  and the tree as seeded).

To change the tree, edit the documents in nirnroot's clone, run
`nirnroot validate`, `nirnroot publish` to sign them off (a commit in
the clone, nothing sent), and `nirnroot seed-tree` to send them, seed
new Nodes and bring the agents in step; to change code, file a sheo-stack ticket naming the
part's agent (`n-<node>`, `t-<node>`, `s-<shape>`, `f-<node>`).
