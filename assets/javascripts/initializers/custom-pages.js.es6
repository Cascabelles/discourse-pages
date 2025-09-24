/* global CodeMirror */
import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("1.8.0", (api) => {
  // ----- ADMIN: Editor de código para el setting -----
  const currentUser = api.container.lookup("service:currentUser");
  const siteSettings = api.container.lookup("service:siteSettings");

  function resolveMode(lang) {
    switch (lang) {
      case "yaml": return "yaml";
      case "json": return { name: "javascript", json: true };
      case "javascript": return "javascript";
      case "css": return "css";
      case "markdown": return "markdown";
      case "handlebars": return "handlebars";
      case "htmlmixed":
      default: return "htmlmixed";
    }
  }

  function enhanceSettingEditor() {
    const sel = '.setting[data-setting="custom_pages_templates"] textarea';
    const ta = document.querySelector(sel);
    if (!ta || ta.dataset.enhancedWithCM) return;

    ta.dataset.enhancedWithCM = "1";

    const lang = siteSettings?.custom_pages_templates_language || "yaml";
    const cm = CodeMirror.fromTextArea(ta, {
      mode: resolveMode(lang),
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      theme: "dracula", // usa "default" si no registraste dracula.css
      matchBrackets: true,
      viewportMargin: Infinity,
    });

    cm.on("change", () => {
      ta.value = cm.getValue();
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });

    setTimeout(() => cm.refresh(), 0);
    ta.form?.addEventListener("submit", () => (ta.value = cm.getValue()));
  }

  api.onPageChange((url) => {
    if (currentUser?.admin && url?.startsWith("/admin")) {
      // La tabla de settings carga asíncrona: intenta varias veces
      let tries = 0;
      const iv = setInterval(() => {
        tries += 1;
        try { enhanceSettingEditor(); } catch {}
        if (tries > 30) clearInterval(iv);
      }, 100);
    }
  });

  // ----- FRONT: tu lógica de páginas /p/:slug (sin cambios) -----
  if (!siteSettings?.custom_pages_enabled) return;

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
    const outlet = document.getElementById("main-outlet");
    if (outlet?.parentNode && rootEl.previousElementSibling !== outlet) {
      outlet.parentNode.insertBefore(rootEl, outlet);
    } else if (!outlet) {
      const main = document.getElementById("main") || document.body;
      if (main.firstChild) main.insertBefore(rootEl, main.firstChild);
      else main.appendChild(rootEl);
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
    if (s) activate(s);
    else deactivate();
  }

  api.onAppEvent("app:ready", () => onRouteChange());
  api.onPageChange((url) => onRouteChange(url));
});
