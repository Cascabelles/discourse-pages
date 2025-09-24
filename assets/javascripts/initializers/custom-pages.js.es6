import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("1.8.0", (api) => {
  const siteSettings = api.container?.lookup?.("site-settings:main") || {};
  if (!siteSettings.custom_pages_enabled) return;

  // Base path (subcarpeta)
  let basePath = "";
  try {
    const absRoot = api.getURL("/");
    const a = document.createElement("a");
    a.href = absRoot;
    basePath = (a.pathname || "").replace(/\/+$/, "");
  } catch {
    basePath = "";
  }
  function stripBase(pathname) {
    if (!basePath) return pathname;
    if (pathname.indexOf(basePath) === 0) {
      const rest = pathname.slice(basePath.length);
      return rest || "/";
    }
    return pathname;
  }

  // Estado y helpers DOM
  let active = false;
  let slug = null;
  let rootEl = null;

  function ensureRoot() {
    if (rootEl && document.body.contains(rootEl)) return rootEl;
    rootEl = document.getElementById("custom-page-root");
    if (!rootEl) {
      rootEl = document.createElement("section");
      rootEl.id = "custom-page-root";
      rootEl.className = "custom-page";
      rootEl.style.display = "none";
    }
    // Insertar antes de #main-outlet
    const outlet = document.getElementById("main-outlet");
    if (outlet && outlet.parentNode && rootEl.previousElementSibling !== outlet) {
      outlet.parentNode.insertBefore(rootEl, outlet);
    } else if (!outlet) {
      // fallback: al principio del #main
      const main = document.getElementById("main") || document.body;
      if (main.firstChild) {
        main.insertBefore(rootEl, main.firstChild);
      } else {
        main.appendChild(rootEl);
      }
    }
    return rootEl;
  }

  function setLayoutHidden(hidden) {
    const outlet = document.getElementById("main-outlet");
    if (outlet) outlet.style.display = hidden ? "none" : "";
    document.documentElement.classList.toggle("custom-page--active", hidden);
  }

  async function loadAndRender(currentSlug) {
    const el = ensureRoot();
    el.innerHTML = `
      <div class="custom-page__loading container">
        <div class="spinner"></div>
      </div>
    `;
    el.style.display = "block";

    try {
      const json = await ajax(`/plugin-pages/${encodeURIComponent(currentSlug)}.json`);
      const title = json.title || currentSlug;
      const cooked = json.cooked || "<p>(Vacío)</p>";
      document.title = title;
      el.innerHTML = `
        <div class="custom-page__inner container">
          <h1 class="custom-page__title">${title}</h1>
          <article class="custom-page__content cooked">${cooked}</article>
        </div>
      `;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[custom-pages] load error", e);
      el.innerHTML = `
        <div class="custom-page__inner container">
          <h1 class="custom-page__title">${currentSlug}</h1>
          <article class="custom-page__content">
            <p>No se pudo cargar la página <code>${currentSlug}</code>.</p>
          </article>
        </div>
      `;
    }
  }

  function matchSlug(pathname) {
    const rel = stripBase(pathname || "/");
    const m = rel.match(/^\/p\/([^/]+)\/?$/i);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function activate(currentSlug) {
    if (active && slug === currentSlug) return;
    active = true;
    slug = currentSlug;
    setLayoutHidden(true);
    await loadAndRender(currentSlug);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    slug = null;
    setLayoutHidden(false);
    const el = ensureRoot();
    el.style.display = "none";
    el.innerHTML = "";
  }

  function onRouteChange(urlLike) {
    const a = document.createElement("a");
    a.href = urlLike || window.location.href;
    const s = matchSlug(a.pathname);
    if (s) {
      activate(s);
    } else {
      deactivate();
    }
  }

  // Arranque y SPA
  api.onAppEvent("app:ready", () => onRouteChange());
  api.onPageChange((url) => onRouteChange(url));
});
