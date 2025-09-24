import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  // Lee settings de forma segura desde el contenedor
  const siteSettings =
    (api.container && api.container.lookup?.("site-settings:main")) || {};

  if (!siteSettings.custom_pages_enabled) {
    // Nada que hacer si está desactivado
    return;
  }

  // Añade la ruta SPA: /p/:slug
  api.addFullPageRoute("p/:slug", "plugin-page");
});
