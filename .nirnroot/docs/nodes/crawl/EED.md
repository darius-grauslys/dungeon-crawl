# crawl

The root of Crawl, a real-time cooperative dungeon crawler played in the
browser by up to four players a session: the party goes down five floors
of rooms and corridors, fighting bats, slimes, snakes, skeletons and
demons, picking up potions, gold, swords and armor, and wins by reaching
the stairs of the fifth floor together. The root owns nothing but the
program's entry, run by the launcher (`npm start`): it starts the game's
server, which hands the game to browsers and runs every session.

# API Shapes:
None

# Functions:
## Function - main:
`main() -> promise`. Starts `server` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive.

# Intrinsics:
None
