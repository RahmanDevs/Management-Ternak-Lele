import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const dialogPrototype = HTMLDialogElement.prototype;
const dialogDescriptors = Object.fromEntries(
  ["showModal", "close"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(dialogPrototype, name),
  ]),
);

beforeEach(() => {
  // Freeze calendar time only; user-event and React keep real scheduling timers.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T03:00:00.000Z"));
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});

  // jsdom does not provide native dialog rendering, focus trapping, or layout.
  Object.defineProperties(dialogPrototype, {
    showModal: {
      configurable: true,
      writable: true,
      value: vi.fn(function () {
        this.setAttribute("open", "");
      }),
    },
    close: {
      configurable: true,
      writable: true,
      value: vi.fn(function () {
        this.removeAttribute("open");
      }),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  for (const [name, descriptor] of Object.entries(dialogDescriptors)) {
    if (descriptor) Object.defineProperty(dialogPrototype, name, descriptor);
    else delete dialogPrototype[name];
  }
  vi.useRealTimers();
});
