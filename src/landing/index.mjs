// landing: the landing screen.

import * as save from "../../shapes/save/index.mjs";

let root = null;

/** `show(document, {create, join}) -> handle`. Puts the landing in `document.body` (once: a second `show` while one stands throws an `Error`), shown. */
export function show(document, { create, join }) {
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
