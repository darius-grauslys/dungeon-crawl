// The edge test for menu: closed, buttons, paused, session.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mount } from "../../../edges/edge_to_menu.mjs";

test("closed: mount closed, open, close", async () => {
  const handle = mount(document, {
    settings: () => {}, save: () => {}, pause: () => {}, back: () => {},
  });
  const menu = document.getElementById("menu");
  assert.ok(menu, "#menu is in the page after mount");
  assert.strictEqual(getComputedStyle(menu).display, "none", "#menu not displayed after mount");
  assert.strictEqual(handle.isOpen(), false, "isOpen() false after mount");
  handle.open();
  assert.notStrictEqual(getComputedStyle(menu).display, "none", "#menu displayed after open()");
  assert.strictEqual(handle.isOpen(), true, "isOpen() true after open()");
  handle.close();
  assert.strictEqual(getComputedStyle(menu).display, "none", "#menu not displayed after close()");
  assert.strictEqual(handle.isOpen(), false, "isOpen() false after close()");
  handle.remove();
});

test("buttons: clicks call handlers, back closes", async () => {
  const calls = { settings: 0, save: 0, pause: null, back: 0 };
  const handle = mount(document, {
    settings: () => { calls.settings++; },
    save: () => { calls.save++; },
    pause: (v) => { calls.pause = v; },
    back: () => { calls.back++; },
  });
  handle.open();
  document.getElementById("menu-settings").click();
  assert.strictEqual(calls.settings, 1, "#menu-settings calls settings once");
  assert.strictEqual(handle.isOpen(), true, "#menu-settings leaves the menu open");
  document.getElementById("menu-save").click();
  assert.strictEqual(calls.save, 1, "#menu-save calls save once");
  assert.strictEqual(handle.isOpen(), true, "#menu-save leaves the menu open");
  document.getElementById("menu-pause").click();
  assert.strictEqual(calls.pause, true, "#menu-pause calls pause(true) once");
  assert.strictEqual(handle.isOpen(), true, "#menu-pause leaves the menu open");
  document.getElementById("menu-back").click();
  assert.strictEqual(calls.back, 1, "#menu-back calls back once");
  assert.strictEqual(handle.isOpen(), false, "#menu-back closes the menu");
  handle.remove();
});

test("paused: pause button text and click", async () => {
  let pausedCall = null;
  const handle = mount(document, {
    settings: () => {}, save: () => {}, pause: (v) => { pausedCall = v; }, back: () => {},
  });
  const pauseBtn = document.getElementById("menu-pause");
  assert.strictEqual(pauseBtn.textContent, "Pause", "#menu-pause reads Pause");
  handle.setPaused(true);
  assert.strictEqual(pauseBtn.textContent, "Resume", "#menu-pause reads Resume after setPaused(true)");
  pauseBtn.click();
  assert.strictEqual(pausedCall, false, "click after setPaused(true) calls pause(false)");
  handle.setPaused(false);
  assert.strictEqual(pauseBtn.textContent, "Pause", "#menu-pause reads Pause after setPaused(false)");
  handle.remove();
});

test("session: session line and remove", async () => {
  const handle = mount(document, {
    settings: () => {}, save: () => {}, pause: () => {}, back: () => {},
  });
  handle.setSession("ABCDEF", "xyz234");
  const sessionP = document.getElementById("menu-session");
  assert.strictEqual(sessionP.textContent, "Session ABCDEF   Password xyz234", "#menu-session text after setSession");
  handle.remove();
  assert.strictEqual(document.getElementById("menu"), null, "no #menu in the page after remove()");
});
