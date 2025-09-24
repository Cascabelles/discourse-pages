import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("1.8.0", (api) => {
  // settings seguros
  const siteSettings = api.container?.lookup?.("site-settings:main") || {};
  if (!siteSettings.custom_pages_enabled) return;

  // base path (subcarpeta)
  let basePath = "";
  try {
    const absRoot = api.getURL("/");
    const a = document.createElement("a"); a.href = absRoot;
    basePath = (a.pathname || "").replace(/\/+$/, "");
  } catch { basePath = ""; }

  function stripBase(pathname) {
    if (!basePath) return pathname;
    if (pathname.indexOf(basePath) === 0) {
      const rest = pathname.slice(basePath.length);
      return rest || "/";
    }
    return pathname;
  }

  // === Registrar un service para estado compartido ===
  // nombre: service:custom-pages
  class CustomPagesState {
    active = false;
    slug = null;
    title = null;
    cooked = null;
    loading = false;
    error = null;
  }

  // registra service singleton
  api.container.register("service:custom-pages", CustomPagesState);
  const state = api.container.lookup("service:custom-pages");

  function matchCustomPage(pathname) {
    const rel = stripBase(pathname || "/");
    const m = rel.match(/^\/p\/([^/]+)\/?$/i);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function loadPage(slug) {
    state.loading = true;
    state.error = null;
    try {
      const json = await ajax(`/plugin-pages/${encodeURIComponent(slug)}.json`);
      state.title = json.title || slug;
      state.cooked = json.cooked || "";
      document.title = state.title;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[custom-pages] load error", e);
      state.error = true;
      state.title = slug;
      state.cooked = "<p>La página no existe o no se pudo cargar.</p>";
    } finally {
      state.loading = false;
      // fuerza rerender del componente (cambiando una prop reactivamente no siempre basta)
      const appEvents = api.container.lookup("service:app-events");
      appEvents?.trigger?.("custom-pages:rerender");
    }
  }

  async function setActive(slugOrNull) {
    const root = document.documentElement;
    if (slugOrNull) {
      state.active = true;
      state.slug = slugOrNull;
      root.classList.add("custom-page--active");
      await loadPage(slugOrNull);
    } else {
      state.active = false;
      state.slug = state.title = state.cooked = null;
      root.classList.remove("custom-page--active");
      const appEvents = api.container.lookup("service:app-events");
      appEvents?.trigger?.("custom-pages:rerender");
    }
  }

  function onRouteChange(urlLike) {
    const a = document.createElement("a");
    a.href = urlLike || window.location.href;
    const slug = matchCustomPage(a.pathname);
    if (slug) {
      if (!state.active || state.slug !== slug) setActive(slug);
    } else if (state.active) {
      setActive(null);
    }
  }

  // Renderizar el componente en el outlet
  api.renderInOutlet("above-main-container", "custom-page-view");

  api.onAppEvent("app:ready", () => onRouteChange());
  api.onPageChange((url) => onRouteChange(url));
});
