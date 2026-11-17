import { t } from "../../shared/i18n.js";
import type { Language } from "../../shared/types.js";

export function renderBlockedNotice(
  container: HTMLElement,
  language: Language,
  handlers: { onHome: () => void; onMessages: () => void; onDismiss: () => void }
): () => void {
  const wrap = document.createElement("div");
  wrap.className = "of-blocked of-interactive";
  wrap.innerHTML = `
    <div class="of-blocked-card" role="alertdialog" aria-modal="true">
      <h2 class="of-brand" style="font-size:1.15rem">${t("blockedTitle", language)}</h2>
      <p class="of-tagline">${t("blockedBody", language)}</p>
      <div class="of-row" style="justify-content:center;margin-top:14px">
        <button type="button" class="of-btn of-btn-primary" data-of="home">${t("goHome", language)}</button>
        <button type="button" class="of-btn" data-of="dm">${t("openMessages", language)}</button>
        <button type="button" class="of-btn of-btn-ghost" data-of="dismiss">${t("close", language)}</button>
      </div>
    </div>
  `;
  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest("button[data-of]") as HTMLButtonElement | null;
    if (!btn) return;
    if (btn.dataset.of === "home") handlers.onHome();
    if (btn.dataset.of === "dm") handlers.onMessages();
    if (btn.dataset.of === "dismiss") handlers.onDismiss();
  };
  wrap.addEventListener("click", onClick);
  container.append(wrap);
  return () => {
    wrap.removeEventListener("click", onClick);
    wrap.remove();
  };
}
