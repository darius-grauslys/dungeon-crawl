# Rules for this tree

This project is a nirnroot program tree. You work one part of it: a
Node's implementation, the tests of the edge into a Node, an API
Shape's code, or a Node's fixtures (test helpers for the tests below
it). The documents that open this prompt are your
specification; you can't change them.

# Standing down
- If you think this tree's documents are wrong, or what you depend on is
  (an edge test, if you implement the Node; the Node's implementation,
  if you test its edge; a shape's document or a Node's use of it, if you
  implement the shape; a fixture's document, or the routing it
  reproduces, if you write a fixture), don't change it and don't work
  around it: say so
  in your final answer on a line starting `STAND-DOWN:`, with why, and
  end the run.

# What a commit holds you to
- Every commit, whatever your part, is held to the project's lint, where
  it has one: each file you write parses, its imports resolve and keep
  to the layout, and each test file asserts something. Fix what it
  names. Your imports keep to what your documents give you: a shape or
  a fixture they don't list is refused, and listing it is the
  documents' author's, not yours (a stand-down, if you need it).
- If you implement a Node, each commit also runs your Node's tests and
  the tests of the edges into the Nodes below yours, and tells you what
  failed. None of it stops the commit: the merge holds all of it, once
  the Nodes below are in.
- Read each failure of your own tests. It may be your code, your test,
  or a Node below that isn't written yet or is wrong. Fix what is yours,
  checked against your documents: never rewrite code your documents
  ask for, nor cut a test, just to make a test pass. What waits on a
  Node below, leave, and say so in your final answer.
- The tests of the Nodes below are never yours to pass: they are told
  so you know what you are calling. Don't change your code to make one
  pass, and never touch another Node's code or tests.
- If you test an edge, your commits are held to your tests being
  written, not passing; your merge, with the Node's, to them passing.
- If you implement a Node, each commit also tells you which parts your
  documents reference (shapes, fixtures, children, edge tests) aren't
  implemented yet. None of it stops the commit, and none is yours to
  write: your merge (its promotion) is held to them being implemented,
  on the target or in your staging group. If yours is refused for one,
  say which in your final answer; don't stub or rebuild it.
- If you implement a Shape or write a Node's fixtures, take its
  `_sheo_stub` marker out of the code once it is implemented: your
  commits are held to it.
- Your ticket may say which failures to expect.

# A Shape's tests
- If you implement a Shape, you write its tests too: what each
  constructor builds and what it refuses, each getter and setter, and
  each intrinsic of the Shape's document. Your commit is held to them.
- A Node's tests don't test a Shape again: they rely on what a Shape
  built being what its document says.

# A Node's fixtures
- If you write a Node's fixtures, you write their tests too: each
  intrinsic of each fixture's document. Your commit is held to them.
- A fixture reproduces part of its Node's routing with the real Nodes
  below, reached through their call sites: never a stand-in for a Node,
  never the Node's own code, never another Node's fixtures.
- If your documents list a fixture, take its product from it: don't
  rebuild what it builds, and never change it. A fixture that doesn't
  give what your test needs is a stand-down, not a stand-in.

# Side-effects
- A side-effect is anything that reads from or writes to the world
  outside the program tree: files, network, clock, environment, user I/O.
- Only a Node whose ISD declares a side-effect may perform it, and only
  as its ISD describes it.
- EEDs, EETs, ITDs and Shape documents never describe side-effects.
- A Shape's code is its constructors, its getters and setters, and
  what they need. It never performs a side-effect, and never calls a
  Node's code: the only Node code a Shape holds is a callback to a
  function declared in a Node's EED, which a Node calls.
- If your work needs a side-effect your Node's ISD doesn't declare, stop
  and say so; don't add it.
