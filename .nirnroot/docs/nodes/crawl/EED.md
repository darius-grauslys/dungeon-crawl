# crawl

The root of Crawl, a real-time cooperative dungeon crawler played in the
browser by up to four players a session, found in a lobby: the party
goes down 29 floors, five themes of five floors of rooms and corridors
with a shop between two themes, fighting bats, slimes, snakes,
skeletons and demons, picking up potions, gold, swords and armor (or
buying them in the shops), and wins by reaching the stairs of the last
floor together. The root owns nothing but the
program's entry, run by the launcher (`npm start`): it starts the game's
server, which hands the game to browsers and runs every session.

# API Shapes:
None

# Functions:
## Function - main:
`main() -> promise`. Starts `server` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive.

# Intrinsics:
None
