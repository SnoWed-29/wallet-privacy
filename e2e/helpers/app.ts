import { remote, type Browser } from "webdriverio";

export async function connectToDesktopApp(): Promise<Browser> {
  return remote({
    hostname: "127.0.0.1",
    port: 4444,
    path: "/",
    capabilities: {
      browserName: "wry",
    },
  });
}

export async function closeDesktopApp(browser: Browser) {
  await browser.deleteSession();
}
