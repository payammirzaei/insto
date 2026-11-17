async function loadReleases() {
  const box = document.getElementById("downloads");
  const btn = document.getElementById("download-btn");
  if (!box) return;

  try {
    const res = await fetch("/api/release", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const files = (data.files || []).filter(
      (f) => f.endsWith(".zip") || f.endsWith(".xpi") || f.endsWith(".txt")
    );

    if (!files.length) {
      box.innerHTML =
        "<p class=\"muted\">No release artifacts yet. On Railway, the build runs <code>npm run package</code>.</p>";
      return;
    }

    box.innerHTML = "";
    for (const file of files) {
      const a = document.createElement("a");
      a.href = `/download/${encodeURIComponent(file)}`;
      a.textContent =
        file.endsWith(".zip") || file.endsWith(".xpi")
          ? `Download ${file}`
          : `View ${file}`;
      if (file.endsWith(".zip") || file.endsWith(".xpi")) {
        a.setAttribute("download", file);
        if (btn && btn.tagName === "A") {
          btn.href = a.href;
          btn.setAttribute("download", file);
        }
      }
      box.append(a);
    }
  } catch (err) {
    box.innerHTML = `<p class="muted">Could not list releases (${String(err.message || err)}).</p>`;
  }
}

void loadReleases();
