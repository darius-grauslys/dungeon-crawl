import test from "node:test";
import assert from "node:assert/strict";
import { mount } from "../../../src/menu/index.mjs";

test("menu: closed state after mount, open and close", () => {
  const handlers = { settings: () => {}, save: () => {}, pause: () => {}, back: () => {} };
  const menu = mount(document, handlers);

  const menuEl = document.getElementById("menu");
  assert.ok(menuEl, "#menu is in the page");
  assert.strictEqual(getComputedStyle(menuEl).display, "none", "not displayed after mount");
  assert.strictEqual(menu.isOpen(), false, "isOpen() false after mount");

  menu.open();
  assert.strictEqual(getComputedStyle(menuEl).display, "block", "displayed after open");
  assert.strictEqual(menu.isOpen(), true, "isOpen() true after open");

  menu.close();
  assert.strictEqual(getComputedStyle(menuEl).display, "none", "not displayed after close");
  assert.strictEqual(menu.isOpen(), false, "isOpen() false after close");

  menu.remove();
});

test("menu: buttons call handlers", () => {
  let settingsCalls = 0, saveCalls = 0, pauseCalls = 0, backCalls = 0;
  const handlers = {
    settings: () => { settingsCalls++; },
    save: () => { saveCalls++; },
    pause: () => { pauseCalls++; },
    back: () => { backCalls++; }
  };
  const menu = mount(document, handlers);
  menu.open();

  document.getElementById("menu-settings").click();
  assert.strictEqual(settingsCalls, 1, "settings called once");

  document.getElementById("menu-save").click();
  assert.strictEqual(saveCalls, 1, "save called once");

  document.getElementById("menu-pause").click();
  assert.strictEqual(pauseCalls, 1, "pause called once");

  assert.strictEqual(menu.isOpen(), true, "menu still open after button clicks");

  document.getElementById("menu-back").click();
  assert.strictEqual(backCalls, 1, "back called once");
  assert.strictEqual(menu.isOpen(), false, "menu closed after back");

  menu.remove();
});

test("menu: paused text and pause click", () => {
  let pauseCalls = [];
  const handlers = {
    settings: () => {}, save: () => {}, pause: (p) => { pauseCalls.push(p); }, back: () => {}
  };
  const menu = mount(document, handlers);
  menu.open();

  const pauseBtn = document.getElementById("menu-pause");
  assert.strictEqual(pauseBtn.textContent, "Pause", "pause button reads Pause");

  menu.setPaused(true);
  assert.strictEqual(pauseBtn.textContent, "Resume", "pause button reads Resume after setPaused(true)");

  pauseBtn.click();
  assert.strictEqual(pauseCalls.length, 1, "pause called once");
  assert.strictEqual(pauseCalls[0], false, "pause(false) called after setPaused(true)");

  menu.setPaused(false);
  assert.strictEqual(pauseBtn.textContent, "Pause", "pause button reads Pause after setPaused(false)");

  menu.remove();
});

test("menu: session line and remove", () => {
  const handlers = { settings: () => {}, save: () => {}, pause: () => {}, back: () => {} };
  const menu = mount(document, handlers);

  const sessionEl = document.getElementById("menu-session");
  assert.strictEqual(sessionEl.textContent, "", "session line empty before setSession");

  menu.setSession("ABCDEF");
  assert.strictEqual(sessionEl.textContent, "Session ABCDEF", "session line text after setSession");

  menu.remove();
  assert.strictEqual(document.getElementById("menu"), null, "no #menu in page after remove");
});
