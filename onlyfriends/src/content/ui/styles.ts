/** Injected stylesheet for OnlyFriends overlay UI (shadow-friendly via element styles + this CSS text). */
export const OF_CSS = `
:host, #onlyfriends-root {
  all: initial;
  font-family: "Segoe UI", "Tahoma", "Vazirmatn", "Iran Sans", system-ui, sans-serif;
  color-scheme: light dark;
}

#onlyfriends-root {
  position: fixed;
  z-index: 2147483646;
  inset: 0;
  pointer-events: none;
  font-size: 15px;
  line-height: 1.45;
}

#onlyfriends-root * {
  box-sizing: border-box;
}

#onlyfriends-root .of-interactive {
  pointer-events: auto;
}

#onlyfriends-root[data-theme="light"] {
  --of-bg: #f7f5f2;
  --of-surface: #ffffff;
  --of-ink: #1c1917;
  --of-muted: #78716c;
  --of-line: #e7e5e4;
  --of-accent: #0f766e;
  --of-accent-soft: #ccfbf1;
  --of-danger: #b45309;
  --of-shadow: 0 12px 40px rgba(28, 25, 23, 0.12);
}

#onlyfriends-root[data-theme="dark"] {
  --of-bg: #141210;
  --of-surface: #1c1917;
  --of-ink: #f5f5f4;
  --of-muted: #a8a29e;
  --of-line: #292524;
  --of-accent: #2dd4bf;
  --of-accent-soft: #134e4a;
  --of-danger: #fbbf24;
  --of-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.of-fab {
  position: fixed;
  right: max(12px, env(safe-area-inset-right));
  /* Sit above Instagram bottom nav (~56px) + Firefox Android chrome */
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid var(--of-line);
  background: var(--of-surface);
  color: var(--of-ink);
  box-shadow: var(--of-shadow);
  display: grid;
  place-items: center;
  cursor: pointer;
  font-weight: 650;
  letter-spacing: 0.02em;
  transition: transform 160ms ease, background 160ms ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

@media (max-width: 640px) {
  .of-fab {
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    width: 56px;
    height: 56px;
  }
}

.of-fab:hover, .of-fab:focus-visible {
  transform: translateY(-1px);
  outline: 2px solid var(--of-accent);
  outline-offset: 2px;
}

[dir="rtl"] .of-fab {
  right: auto;
  left: max(12px, env(safe-area-inset-left));
}

.of-timer {
  position: fixed;
  top: max(8px, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--of-surface) 92%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--of-line);
  color: var(--of-muted);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  box-shadow: var(--of-shadow);
  cursor: pointer;
  max-width: min(92vw, 320px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.of-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.of-panel {
  width: min(440px, 100%);
  max-height: min(88vh, 720px);
  max-height: min(88dvh, 720px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--of-surface);
  color: var(--of-ink);
  border-radius: 20px 20px 16px 16px;
  border: 1px solid var(--of-line);
  box-shadow: var(--of-shadow);
  padding: 18px 16px 20px;
  animation: of-rise 220ms ease;
}

@keyframes of-rise {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.of-brand {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}

.of-tagline {
  margin: 4px 0 14px;
  color: var(--of-muted);
  font-size: 0.92rem;
}

.of-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 8px 0;
  flex-wrap: wrap;
}

.of-label {
  display: block;
  font-size: 0.8rem;
  color: var(--of-muted);
  margin-bottom: 4px;
}

.of-field {
  width: 100%;
  margin: 12px 0;
}

.of-input, .of-select {
  width: 100%;
  border: 1px solid var(--of-line);
  background: var(--of-bg);
  color: var(--of-ink);
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
}

.of-input:focus-visible, .of-select:focus-visible, .of-btn:focus-visible {
  outline: 2px solid var(--of-accent);
  outline-offset: 2px;
}

.of-btn {
  border: 1px solid var(--of-line);
  background: var(--of-bg);
  color: var(--of-ink);
  border-radius: 12px;
  padding: 10px 14px;
  font: inherit;
  cursor: pointer;
}

.of-btn-primary {
  background: var(--of-accent);
  color: #042f2e;
  border-color: transparent;
  font-weight: 650;
}

.of-btn-ghost {
  background: transparent;
}

.of-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.of-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--of-accent-soft);
  color: var(--of-ink);
  font-size: 0.85rem;
}

.of-chip button {
  border: 0;
  background: transparent;
  color: var(--of-muted);
  cursor: pointer;
  font: inherit;
  padding: 0 2px;
}

.of-hint {
  font-size: 0.8rem;
  color: var(--of-muted);
  margin: 6px 0 0;
}

.of-banner {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--of-accent-soft);
  color: var(--of-ink);
  font-size: 0.85rem;
}

.of-banner.warn {
  background: color-mix(in srgb, var(--of-danger) 18%, var(--of-surface));
}

.of-end {
  position: fixed;
  inset: 0;
  background: var(--of-bg);
  color: var(--of-ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  text-align: center;
  gap: 10px;
}

.of-end h1 {
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  margin: 0;
  letter-spacing: -0.03em;
  font-weight: 700;
}

.of-end p {
  margin: 0;
  color: var(--of-muted);
  font-size: 1.05rem;
}

.of-end .of-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 18px;
}

.of-blocked {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--of-bg) 88%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.of-blocked-card {
  width: min(380px, 100%);
  background: var(--of-surface);
  border: 1px solid var(--of-line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--of-shadow);
  text-align: center;
}

.of-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.of-switch input {
  width: 18px;
  height: 18px;
}

.of-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}
`;
