// landing: the landing screen.

import * as save from "../../shapes/save/index.mjs";

let root = null;

/** `show(document, {create, join}, options) -> handle`. Puts the landing in `document.body` (once: a second `show` while one stands throws an `Error`), shown. */
export function show(document, { create, join }, options = {}) {
  if (root) throw new Error("landing: a landing already stands");

  root = document.createElement("div");
  root.id = "landing";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.top = "50%";
  root.style.transform = "translate(-50%, -50%)";
  root.style.backgroundColor = "#160d13";
  root.style.color = "#ffffff";
  root.style.display = "block";

  const nameInput = document.createElement("input");
  nameInput.id = "landing-name";
  nameInput.maxLength = 16;

  const joinGameHeading = document.createElement("p");
  joinGameHeading.textContent = "Join a game";

  const lobbyList = document.createElement("ul");
  lobbyList.id = "landing-lobby";

  const newGameHeading = document.createElement("p");
  newGameHeading.textContent = "New game";

  const saveInput = document.createElement("input");
  saveInput.id = "landing-save";
  saveInput.type = "file";
  saveInput.accept = ".json,application/json";

  const createButton = document.createElement("button");
  createButton.id = "landing-create";
  createButton.textContent = "Create session";

  const errorP = document.createElement("p");
  errorP.id = "landing-error";

  root.appendChild(nameInput);
  root.appendChild(joinGameHeading);
  root.appendChild(lobbyList);
  root.appendChild(newGameHeading);
  root.appendChild(saveInput);
  root.appendChild(createButton);

  let debugDiv = null;
  let debugDepthInput = null;
  const buffInputs = {};
  let debugCreateButton = null;
  const bossButtons = [];

  if (options.debug) {
    debugDiv = document.createElement("div");
    debugDiv.id = "landing-debug";

    const debugHeading = document.createElement("p");
    debugHeading.textContent = "Debug";

    debugDepthInput = document.createElement("input");
    debugDepthInput.id = "landing-debug-depth";
    debugDepthInput.type = "number";
    debugDepthInput.min = "1";
    debugDepthInput.max = "33";
    debugDepthInput.step = "1";
    debugDepthInput.value = "1";

    const buffStats = ["hp", "attack", "defense", "range", "magic", "magicPower", "magicResist"];
    for (const stat of buffStats) {
      const buffInput = document.createElement("input");
      buffInput.id = `landing-debug-${stat}`;
      buffInput.type = "number";
      buffInput.min = "0";
      buffInput.step = "1";
      buffInput.value = "0";
      if (stat === "range") {
        buffInput.max = "8";
      }
      const label = document.createElement("label");
      label.htmlFor = buffInput.id;
      label.textContent = stat;
      debugDiv.appendChild(label);
      debugDiv.appendChild(buffInput);
      buffInputs[stat] = buffInput;
    }

    debugCreateButton = document.createElement("button");
    debugCreateButton.id = "landing-debug-create";
    debugCreateButton.textContent = "Start debug session";

    const bossDepths = [7, 14, 21, 28];
    const bossLabels = ["Lair 1 (golem)", "Lair 2", "Lair 3", "Lair 4"];
    for (let i = 0; i < bossDepths.length; i++) {
      const bossButton = document.createElement("button");
      bossButton.className = "landing-debug-boss";
      bossButton.dataset.depth = String(bossDepths[i]);
      bossButton.textContent = bossLabels[i];
      bossButtons.push(bossButton);
    }

    debugDiv.appendChild(debugHeading);
    debugDiv.appendChild(debugDepthInput);
    for (const stat of ["hp", "attack", "defense", "range", "magic", "magicPower", "magicResist"]) {
      debugDiv.appendChild(buffInputs[stat]);
    }
    debugDiv.appendChild(debugCreateButton);
    for (const bb of bossButtons) {
      debugDiv.appendChild(bb);
    }

    root.appendChild(debugDiv);
  }

  root.appendChild(errorP);

  document.body.appendChild(root);

  const renderLobby = (sessions) => {
    while (lobbyList.firstChild) {
      lobbyList.removeChild(lobbyList.firstChild);
    }
    if (!sessions || sessions.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No sessions yet. Create one!";
      lobbyList.appendChild(li);
      return;
    }
    for (const sess of sessions) {
      const li = document.createElement("li");
      const playerNames = sess.players.length > 0 ? sess.players.join(", ") : "nobody";
      li.textContent = `${sess.session} ${playerNames} (${sess.players.length}/4) Depth ${sess.depth}`;
      const button = document.createElement("button");
      button.className = "landing-join";
      button.textContent = "Join";
      button.dataset.session = sess.session;
      if (sess.players.length >= 4) {
        button.disabled = true;
      }
      button.addEventListener("click", async () => {
        errorP.textContent = "";
        const name = nameInput.value.trim();
        if (!save.isName(name)) {
          errorP.textContent = "Enter a name of 1 to 16 characters.";
          return;
        }
        join(sess.session, name);
      });
      li.appendChild(button);
      lobbyList.appendChild(li);
    }
  };

  createButton.addEventListener("click", async () => {
    errorP.textContent = "";
    const name = nameInput.value.trim();
    if (!save.isName(name)) {
      errorP.textContent = "Enter a name of 1 to 16 characters.";
      return;
    }
    let saveData = null;
    const files = saveInput.files;
    if (files && files.length > 0) {
      const file = files[0];
      try {
        const text = await file.text();
        saveData = save.parse(text);
      } catch {
        errorP.textContent = "That file is not a Crawl save.";
        return;
      }
    }
    create(saveData, name);
  });

  const buildDebugSave = () => {
    errorP.textContent = "";
    const name = nameInput.value.trim();
    if (!save.isName(name)) {
      errorP.textContent = "Enter a name of 1 to 16 characters.";
      return;
    }

    const depth = parseInt(debugDepthInput.value, 10);
    if (!Number.isInteger(depth) || depth < 1 || depth > 33) {
      errorP.textContent = "Debug: depth 1 to 33, buffs whole numbers of 0 or more.";
      return;
    }

    const heroStats = { hp: 24, maxHp: 24, attack: 4, defense: 1, range: 1, magic: 0, magicPower: 1, magicResist: 0 };
    const statsInput = {};
    for (const stat of ["hp", "attack", "defense", "range", "magic", "magicPower", "magicResist"]) {
      const val = parseInt(buffInputs[stat].value, 10);
      if (!Number.isInteger(val) || val < 0) {
        errorP.textContent = "Debug: depth 1 to 33, buffs whole numbers of 0 or more.";
        return;
      }
      if (stat === "range" && val > 8) {
        errorP.textContent = "Debug: depth 1 to 33, buffs whole numbers of 0 or more.";
        return;
      }
      statsInput[stat] = val;
    }

    const stats = {
      hp: heroStats.hp + statsInput.hp,
      maxHp: heroStats.maxHp + statsInput.hp,
      attack: heroStats.attack + statsInput.attack,
      defense: heroStats.defense + statsInput.defense,
      range: heroStats.range + statsInput.range,
      magic: heroStats.magic + statsInput.magic,
      magicPower: heroStats.magicPower + statsInput.magicPower,
      magicResist: heroStats.magicResist + statsInput.magicResist,
    };

    const seed = Math.floor(Math.random() * 4294967296);
    const debugSave = save.of({ seed, depth, players: [{ name, stats }] });
    create(debugSave, name);
  };

  if (options.debug) {
    debugCreateButton.addEventListener("click", buildDebugSave);
    for (const bossButton of bossButtons) {
      bossButton.addEventListener("click", () => {
        debugDepthInput.value = bossButton.dataset.depth;
        buildDebugSave();
      });
    }
  }

  renderLobby([]);

  return {
    lobby(sessions) {
      renderLobby(sessions);
    },
    error(text) {
      errorP.textContent = text;
    },
    hide() {
      root.remove();
      root = null;
    },
    shown() {
      return root !== null;
    },
  };
}
