# crawl

The root of Crawl, a turn-based dungeon crawler played in the browser:
the hero goes down five floors of rooms and corridors, fighting bats,
slimes, snakes, skeletons and demons, picking up potions, gold, a sword
and armor, and wins by taking the stairs on the fifth floor. The root owns
nothing but the program's entry, run by the launcher (`npm start`): it
starts the web server that hands the game to a browser.

# API Shapes:
None

# Functions:
## Function - main:
`main() -> promise`. Starts `serve` on the port of the `PORT` environment variable (an integer; unset or not an integer: 8000) with the project's directory (the current directory) as `root`, then prints `Crawl is running at <url>` (the server's `url`) to standard output, and resolves. The server keeps the process alive.

# Intrinsics:
None
