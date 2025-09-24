# name: discourse-custom-pages
# about: Páginas personalizadas en /p/:slug con contenido Markdown cocinado en servidor
# version: 0.1
# authors: Tú
# url: https://example.com

enabled_site_setting :custom_pages_enabled

after_initialize do
  module ::DiscourseCustomPages
    class Engine < ::Rails::Engine
      engine_name "discourse_custom_pages"
      isolate_namespace DiscourseCustomPages
    end
  end

  # Rutas servidor: JSON para contenido de cada página
  Discourse::Application.routes.append do
    get "/plugin-pages/:slug" => "plugin_pages#show", defaults: { format: :json }
  end
end
