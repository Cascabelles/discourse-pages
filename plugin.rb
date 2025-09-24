# name: discourse-custom-pages-templates
# about: Páginas /p/:slug con HTML/CSS/JS inline (tipo templates)
# version: 0.2
# authors: Casca
# url: https://danmachigaiden.com

enabled_site_setting :custom_pages_enabled

after_initialize do
  module ::CustomPagesTemplates
    class Engine < ::Rails::Engine
      engine_name "custom_pages_templates"
      isolate_namespace CustomPagesTemplates
    end
  end

  Discourse::Application.routes.append do
    get "/p/*slug" => "custom_pages_templates/pages#show", as: :custom_pages_page
  end
end
