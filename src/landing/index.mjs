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
  nameInput.maxlength = 16;

  const saveInput = document.createElement("input");
  saveInput.id = "landing-save";
  saveInput.type = "file";
  saveInput.accept = ".json,application/json";

  const createButton = document.createElement("button");
  createButton.id = "landing-create";
  createButton.textContent = "Create session";

  const sessionInput = document.createElement("input");
  sessionInput.id = "landing-session";

  const passwordInput = document.createElement("input");
  passwordInput.id = "landing-password";

  const joinButton = document.createElement("button");
  joinButton.id = "landing-join";
  joinButton.textContent = "Join session";

  const errorP = document.createElement("p");
  errorP.id = "landing-error";

  const newGameHeading = document.createElement("p");
  newGameHeading.textContent = "New game";

  const joinGameHeading = document.createElement("p");
  joinGameHeading.textContent = "Join a game";

  root.appendChild(nameInput);
  root.appendChild(newGameHeading);
  root.appendChild(saveInput);
  root.appendChild(createButton);
  root.appendChild(joinGameHeading);
  root.appendChild(sessionInput);
  root.appendChild(passwordInput);
  root.appendChild(joinButton);
  root.appendChild(errorP);

  document.body.appendChild(root);

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

  joinButton.addEventListener("click", async () => {
    errorP.textContent = "";
    const name = nameInput.value.trim();
    if (!save.isName(name)) {
      errorP.textContent = "Enter a name of 1 to 16 characters.";
      return;
    }
    const session = sessionInput.value.trim().toUpperCase();
    const password = passwordInput.value.trim();
    if (session === "" || password === "") {
      errorP.textContent = "Enter the session and its password.";
      return;
    }
    join(session, password, name);
  });

  return {
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
