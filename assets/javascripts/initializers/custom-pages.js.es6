import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  if (!api.siteSettings.custom_pages_enabled) return;

  // Ruta de página completa SPA: /p/:slug
  api.addFullPageRoute("p/:slug", "plugin-page");

  // (Opcional) añade links en el header para slugs concretos
  // api.addHeaderLink({ title: "Acerca de", href: "/p/about" });
  // api.addHeaderLink({ title: "Aviso legal", href: "/p/legal" });
});
