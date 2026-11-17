import { t } from "../../shared/i18n.js";
import type { Language } from "../../shared/types.js";

export function renderSessionEnd(
  container: HTMLElement,
  language: Language,
  handlers: {
    onOverride: () => void;
    onNewSession: () => void;
    onMessages: () => void;
  }
): () => void {
  const wrap = document.createElement("div");
  wrap.className = "of-end of-interactive";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.innerHTML = `
    <h1>${t("sessionEndTitle", language)}</h1>
    <p>${t("sessionEndBody", language)}</p>
    <div class="of-actions">
      <button type="button" class="of-btn of-btn-primary" data-of="override">${t("overrideLimit", language)}</button>
      <button type="button" class="of-btn" data-of="new">${t("startNewSession", language)}</button>
      <button type="button" class="of-btn of-btn-ghost" data-of="dm">${t("openMessages", language)}</button>
    </div>
  `;

  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest("button[data-of]") as HTMLButtonElement | null;
    if (!btn) return;
    const action = btn.dataset.of;
    if (action === "override") handlers.onOverride();
    if (action === "new") handlers.onNewSession();
    if (action === "dm") handlers.onMessages();
  };
  wrap.addEventListener("click", onClick);
  container.append(wrap);

  // Soft-block scrolling on the page while session end is shown
  const prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";

  return () => {
    wrap.removeEventListener("click", onClick);
    wrap.remove();
    document.documentElement.style.overflow = prevOverflow;
  };
}
