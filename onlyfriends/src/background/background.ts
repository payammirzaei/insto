import { getSettings, getTimeState } from "../shared/storage.js";

browser.runtime.onInstalled.addListener(() => {
  void getSettings();
  void getTimeState();
});

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "OF_GET_STATE") {
    return Promise.all([getSettings(), getTimeState()]).then(([settings, time]) => ({
      settings,
      time,
    }));
  }
  return undefined;
});
