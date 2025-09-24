import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("1.8.0", (api) => {
  // Lee settings de forma segura
  const siteSettings = api.container?.lookup?.("site-settings:main") || {};
  if (!siteSettings.custom_pages_enabled) return;

  // ===== util basePath =====
  let basePath = "";
  try {
    const absRoot = api.getURL("/");
    const a = document.createElement("a");
    a.href = absRoot;
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

  // ===== estado simple =====
  const state = {
    active: false,
    slug: null,
    title: null,
    cooked: null,
    loading: false,
    error: null
  };

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
      api.queueRerenderWidget("custom-page-view");
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
      api.queueRerenderWidget("custom-page-view");
    }
  }

  // ===== widget de página =====
  api.createWidget("custom-page-view", {
    tagName: "section.custom-page",
    html() {
      if (!state.active) return;
      const inner = [];

      if (state.loading) {
        inner.push(this.h("div.custom-page__loading.container", [
          this.h("div.spinner")
        ]));
      } else {
        inner.push(
          this.h("div.custom-page__inner.container", [
            this.h("h1.custom-page__title", state.title || state.slug),
            this.rawHtml(state.cooked || "")
          ])
        );
      }

      return inner;
    }
  });

  // coloca el widget antes del contenido principal
  api.decorateWidget("above-main-container:before", (helper) => {
    if (!state.active) return;
    return helper.attach("custom-page-view");
  });

  // ===== navegación SPA =====
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

  api.onAppEvent("app:ready", () => onRouteChange());
  api.onPageChange((url) => onRouteChange(url));
});
