// menu: the in-game menu overlay that Escape opens.

/** `mount(document, {settings, save, pause, back}) -> handle`. Puts the menu in `document.body`, closed. A click on a button calls its handler (`pause` with `true` when the button reads `Pause`, `false` when it reads `Resume`); `Back` also closes the menu. Answers a handle: `open()`, `close()`, `isOpen()`; `setPaused(paused)`, the pause button's text (`Resume` when true, `Pause` when false); `setSession(id, password)`, the session line; `remove()`, taking the menu out of the page. */
export function mount(document, { settings, save, pause, back }) {
  const menu = document.createElement("div");
  menu.id = "menu";
  menu.style.position = "fixed";
  menu.style.top = "50%";
  menu.style.left = "50%";
  menu.style.transform = "translate(-50%, -50%)";
  menu.style.display = "none";
  menu.style.backgroundColor = "#160d13";
  menu.style.color = "white";
  menu.style.width = "400px";
  menu.style.maxWidth = "90%";
  menu.style.padding = "16px";

  const session = document.createElement("p");
  session.id = "menu-session";

  const settingsBtn = document.createElement("button");
  settingsBtn.id = "menu-settings";
  settingsBtn.textContent = "Settings";
  settingsBtn.style.display = "block";
  settingsBtn.addEventListener("click", () => { if (settings) settings(); });

  const saveBtn = document.createElement("button");
  saveBtn.id = "menu-save";
  saveBtn.textContent = "Save";
  saveBtn.style.display = "block";
  saveBtn.addEventListener("click", () => { if (save) save(); });

  const pauseBtn = document.createElement("button");
  pauseBtn.id = "menu-pause";
  pauseBtn.textContent = "Pause";
  pauseBtn.style.display = "block";
  pauseBtn.addEventListener("click", () => { pause(pauseBtn.textContent === "Pause"); });

  const backBtn = document.createElement("button");
  backBtn.id = "menu-back";
  backBtn.textContent = "Back";
  backBtn.style.display = "block";
  backBtn.addEventListener("click", () => { if (back) back(); close(); });

  menu.appendChild(session);
  menu.appendChild(settingsBtn);
  menu.appendChild(saveBtn);
  menu.appendChild(pauseBtn);
  menu.appendChild(backBtn);

  document.body.appendChild(menu);

  function open() { menu.style.display = "block"; }
  function close() { menu.style.display = "none"; }
  function isOpen() { return menu.style.display === "block"; }
  function setPaused(paused) { pauseBtn.textContent = paused ? "Resume" : "Pause"; }
  function setSession(id, password) { session.textContent = `Session ${id}   Password ${password}`; }
  function remove() { if (menu.parentNode) menu.parentNode.removeChild(menu); }

  return { open, close, isOpen, setPaused, setSession, remove };
}
