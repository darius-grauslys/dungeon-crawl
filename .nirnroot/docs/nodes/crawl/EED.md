# crawl

The root of Crawl, a real-time cooperative dungeon crawler played in the
browser by up to four players a session, found in a lobby: the party
goes down 25 levels, five themes of five floors of rooms and corridors,
with a shop and then a boss's lair between two themes, fighting the
monsters of each theme (bats, slimes, snakes, skeletons and archers,
beetles, mummies, cultists, spiders, ghosts, reapers, worms, imps,
demons, and the stone golem), moving in eight directions, aiming and
attacking at range, picking up potions, gold, swords, armor, rings and cross necklaces (or
buying them in the shops), and wins by reaching the stairs of the last
floor together, with music for each theme and sounds for what happens. The root owns nothing but the
program's entry, run by the launcher (`npm start`): it starts the game's
server, which hands the game to browsers and runs every session.

# API Shapes:
None

# Functions:
## Function - main:
`main() -> promise`. Starts `server` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, and, when the command line has `--host <address>` or `--host=<address>` (`npm start -- --host 0.0.0.0`), that address as its `host` (otherwise none: every interface), then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive.

# Intrinsics:
None
