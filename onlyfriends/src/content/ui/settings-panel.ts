import { t } from "../../shared/i18n.js";
import { isValidUsername, normalizeUsername } from "../../shared/username.js";
import type { CapabilityReport, Language, Settings } from "../../shared/types.js";

export function renderSettingsPanel(
  container: HTMLElement,
  settings: Settings,
  capabilities: CapabilityReport | null,
  handlers: {
    onSave: (next: Settings) => void;
    onClose: () => void;
  }
): () => void {
  const lang = settings.language;
  const state: Settings = {
    ...settings,
    friends: [...settings.friends],
  };

  const panel = document.createElement("div");
  panel.className = "of-panel-backdrop of-interactive";
  panel.innerHTML = `
    <div class="of-panel" role="dialog" aria-modal="true" aria-label="${t("settings", lang)}">
      <div class="of-row" style="justify-content:space-between">
        <div>
          <h1 class="of-brand">${t("appName", lang)}</h1>
          <p class="of-tagline">${t("tagline", lang)}</p>
        </div>
        <button type="button" class="of-btn of-btn-ghost" data-of="close" aria-label="${t("close", lang)}">✕</button>
      </div>

      <label class="of-switch of-field">
        <span>${t("enabled", lang)}</span>
        <input type="checkbox" data-of="enabled" ${state.enabled ? "checked" : ""} />
      </label>

      <div class="of-field">
        <span class="of-label">${t("friends", lang)}</span>
        <div class="of-row">
          <input class="of-input" data-of="friend-input" placeholder="${t("friendPlaceholder", lang)}" autocomplete="off" spellcheck="false" style="flex:1" />
          <button type="button" class="of-btn of-btn-primary" data-of="add-friend">${t("addFriend", lang)}</button>
        </div>
        <div class="of-chip-list" data-of="friend-list"></div>
        <p class="of-hint" data-of="friends-hint"></p>
      </div>

      <div class="of-field">
        <span class="of-label">${t("mode", lang)}</span>
        <select class="of-select" data-of="mode">
          <option value="strict" ${state.mode === "strict" ? "selected" : ""}>${t("modeStrict", lang)}</option>
          <option value="following" ${state.mode === "following" ? "selected" : ""}>${t("modeFollowing", lang)}</option>
        </select>
        <p class="of-hint" data-of="mode-hint"></p>
      </div>

      <div class="of-field">
        <span class="of-label">${t("sessionLimit", lang)} (${t("minutes", lang)})</span>
        <input class="of-input" type="number" min="1" max="180" data-of="session" value="${state.sessionMinutes}" />
      </div>

      <div class="of-field">
        <span class="of-label">${t("dailyBudget", lang)} (${t("minutes", lang)})</span>
        <input class="of-input" type="number" min="0" max="720" data-of="daily" value="${state.dailyBudgetMinutes ?? 0}" />
        <p class="of-hint">0 = ${t("dailyBudgetOff", lang)}</p>
      </div>

      <div class="of-field">
        <span class="of-label">${t("theme", lang)}</span>
        <select class="of-select" data-of="theme">
          <option value="system" ${state.theme === "system" ? "selected" : ""}>${t("themeSystem", lang)}</option>
          <option value="light" ${state.theme === "light" ? "selected" : ""}>${t("themeLight", lang)}</option>
          <option value="dark" ${state.theme === "dark" ? "selected" : ""}>${t("themeDark", lang)}</option>
        </select>
      </div>

      <div class="of-field">
        <span class="of-label">${t("language", lang)}</span>
        <select class="of-select" data-of="language">
          <option value="en" ${state.language === "en" ? "selected" : ""}>English</option>
          <option value="fa" ${state.language === "fa" ? "selected" : ""}>فارسی</option>
        </select>
      </div>

      <div class="of-banner" data-of="caps"></div>
      <p class="of-hint">${t("privacyNote", lang)}</p>
      <p class="of-hint">${t("limitations", lang)}</p>
      <p class="of-hint">${t("adDisclaimer", lang)}</p>

      <div class="of-row" style="margin-top:16px;justify-content:flex-end">
        <button type="button" class="of-btn of-btn-primary" data-of="save">${t("save", lang)}</button>
      </div>
    </div>
  `;

  const friendList = panel.querySelector('[data-of="friend-list"]') as HTMLElement;
  const friendsHint = panel.querySelector('[data-of="friends-hint"]') as HTMLElement;
  const modeHint = panel.querySelector('[data-of="mode-hint"]') as HTMLElement;
  const caps = panel.querySelector('[data-of="caps"]') as HTMLElement;

  const paintFriends = () => {
    friendList.innerHTML = "";
    if (state.friends.length === 0) {
      friendsHint.textContent = t("noFriendsYet", lang);
    } else {
      friendsHint.textContent = "";
    }
    for (const f of state.friends) {
      const chip = document.createElement("span");
      chip.className = "of-chip";
      chip.innerHTML = `<span>@${f}</span><button type="button" aria-label="${t("remove", lang)}" data-user="${f}">×</button>`;
      friendList.append(chip);
    }
  };

  const paintHints = () => {
    modeHint.textContent =
      state.mode === "strict" ? t("modeStrictHint", lang) : t("modeFollowingHint", lang);
    const lines: string[] = [`${t("capabilities", lang)}:`];
    if (capabilities) {
      lines.push(
        `Following tab: ${capabilities.followingTabDetected ? "yes" : "no"}`,
        `Following variant: ${capabilities.followingVariantAvailable === null ? "unverified" : capabilities.followingVariantAvailable ? "yes" : "no"}`,
        `Feed authors: ${capabilities.feedAuthorMatching}`,
        `Stories: ${capabilities.storyUsernameMatching}`,
        `Story viewer filter: ${capabilities.storyViewerFiltering}`
      );
      if (capabilities.storyViewerFiltering === "unsafe") {
        lines.push(t("storyViewerUnsafe", lang));
      }
    } else {
      lines.push("Not probed yet — open Instagram home to detect.");
    }
    caps.textContent = lines.join(" · ");
  };

  paintFriends();
  paintHints();

  const onClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const closeBtn = target.closest('[data-of="close"]');
    if (closeBtn || target === panel) {
      handlers.onClose();
      return;
    }
    const removeBtn = target.closest("button[data-user]") as HTMLButtonElement | null;
    if (removeBtn?.dataset.user) {
      state.friends = state.friends.filter((u) => u !== removeBtn.dataset.user);
      paintFriends();
      return;
    }
    if (target.closest('[data-of="add-friend"]')) {
      const input = panel.querySelector('[data-of="friend-input"]') as HTMLInputElement;
      const n = normalizeUsername(input.value);
      if (!isValidUsername(n)) return;
      if (!state.friends.includes(n)) state.friends.push(n);
      input.value = "";
      paintFriends();
      return;
    }
    if (target.closest('[data-of="save"]')) {
      const enabled = (panel.querySelector('[data-of="enabled"]') as HTMLInputElement).checked;
      const mode = (panel.querySelector('[data-of="mode"]') as HTMLSelectElement).value as Settings["mode"];
      const sessionMinutes = Number(
        (panel.querySelector('[data-of="session"]') as HTMLInputElement).value
      );
      const dailyRaw = Number(
        (panel.querySelector('[data-of="daily"]') as HTMLInputElement).value
      );
      const theme = (panel.querySelector('[data-of="theme"]') as HTMLSelectElement)
        .value as Settings["theme"];
      const language = (panel.querySelector('[data-of="language"]') as HTMLSelectElement)
        .value as Language;
      handlers.onSave({
        ...state,
        enabled,
        mode,
        sessionMinutes,
        dailyBudgetMinutes: dailyRaw > 0 ? dailyRaw : null,
        theme,
        language,
      });
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") handlers.onClose();
    if (e.key === "Enter") {
      const input = panel.querySelector('[data-of="friend-input"]') as HTMLInputElement;
      if (document.activeElement === input) {
        e.preventDefault();
        (panel.querySelector('[data-of="add-friend"]') as HTMLButtonElement).click();
      }
    }
  };

  panel.addEventListener("click", onClick);
  window.addEventListener("keydown", onKey);
  container.append(panel);

  // Focus trap-ish: focus first input
  queueMicrotask(() => {
    (panel.querySelector('[data-of="friend-input"]') as HTMLInputElement | null)?.focus();
  });

  return () => {
    panel.removeEventListener("click", onClick);
    window.removeEventListener("keydown", onKey);
    panel.remove();
  };
}
