# frozen_string_literal: true

# name: discourse-custom-pages-templates
# about: Páginas /p/:slug con HTML/CSS/JS inline (tipo templates)
# version: 0.2
# authors: Casca
# url: https://danmachigaiden.com

# Assets para ADMIN (CodeMirror)
register_asset "javascripts/vendor/codemirror.js", :admin

register_asset "javascripts/vendor/mode/yaml/yaml.js", :admin
register_asset "javascripts/vendor/mode/javascript/javascript.js", :admin
register_asset "javascripts/vendor/mode/xml/xml.js", :admin
register_asset "javascripts/vendor/mode/css/css.js", :admin
register_asset "javascripts/vendor/mode/markdown/markdown.js", :admin
register_asset "javascripts/vendor/mode/htmlmixed/htmlmixed.js", :admin

register_asset "stylesheets/vendor/codemirror.css", :admin
register_asset "stylesheets/vendor/theme/dracula.css", :admin

enabled_site_setting :custom_pages_enabled

after_initialize do
  module ::CustomPagesTemplates
    class Engine < ::Rails::Engine
      engine_name "custom_pages_templates"
      isolate_namespace CustomPagesTemplates
    end
  end

  # Rutas
  Discourse::Application.routes.append do
    if SiteSetting.custom_pages_enabled
      get "/p/*slug" => "custom_pages_templates/pages#show", as: :custom_pages_page
    end
  end
end
