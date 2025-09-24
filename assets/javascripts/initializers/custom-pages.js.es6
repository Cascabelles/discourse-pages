import { apiInitializer } from "discourse/lib/api";
export default apiInitializer("1.8.0", (api) => {
  const s = api.container?.lookup?.("site-settings:main") || {};
  if (!s.custom_pages_enabled) return;
  if (typeof api.addFullPageRoute === "function") {
    api.addFullPageRoute("p/:slug", "plugin-page");
  }
  // si no existe, no hacemos nada aquí; el widget se encarga
});
