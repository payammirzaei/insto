import { getSettings, setSettings } from "../shared/storage.js";

async function init(): Promise<void> {
  const enabledEl = document.getElementById("enabled") as HTMLInputElement;
  const status = document.getElementById("status") as HTMLElement;
  const openIg = document.getElementById("open-ig") as HTMLButtonElement;
  const openSettings = document.getElementById("open-settings") as HTMLButtonElement;

  const settings = await getSettings();
  enabledEl.checked = settings.enabled;
  status.textContent = settings.friends.length
    ? `${settings.friends.length} friends · ${settings.mode} mode`
    : "No friends yet — open page settings on Instagram.";

  enabledEl.addEventListener("change", async () => {
    const current = await getSettings();
    await setSettings({ ...current, enabled: enabledEl.checked });
    status.textContent = enabledEl.checked ? "Enabled" : "Paused";
  });

  openIg.addEventListener("click", async () => {
    await browser.tabs.create({ url: "https://www.instagram.com/" });
    window.close();
  });

  openSettings.addEventListener("click", async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return;
    const url = tab.url || "";
    if (!url.includes("instagram.com")) {
      status.textContent = "Open Instagram first, then try again.";
      return;
    }
    try {
      await browser.tabs.sendMessage(tab.id, { type: "OF_OPEN_SETTINGS" });
      window.close();
    } catch {
      status.textContent = "Reload the Instagram tab, then open settings.";
    }
  });
}

void init();
