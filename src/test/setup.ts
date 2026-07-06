import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

Element.prototype.scrollIntoView = vi.fn();
window.confirm = vi.fn(() => true);

const localStorageShim = createLocalStorageShim();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageShim,
});

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: localStorageShim,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.clearAllMocks();
});

function createLocalStorageShim(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}
