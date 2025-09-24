# frozen_string_literal: true

class ::PluginPagesController < ::ApplicationController
  requires_login false
  skip_before_action :check_xhr
  skip_before_action :verify_authenticity_token

  def show
    raise Discourse::NotFound unless SiteSetting.custom_pages_enabled

    slug = params[:slug].to_s
    page = lookup_page(slug)
    raise Discourse::NotFound unless page

    cooked = PrettyText.cook(page[:md].to_s, sanitize: true)
    render json: {
      slug: slug,
      title: page[:title].presence || slug,
      cooked: cooked
    }
  end

  private

  def lookup_page(slug)
    raw = SiteSetting.custom_pages_definitions.to_s
    data =
      begin
        JSON.parse(raw)
      rescue JSON::ParserError
        begin
          YAML.safe_load(raw) # permite YAML como alternativa
        rescue StandardError
          {}
        end
      end
    rec = data[slug] || data[slug.to_s]
    return nil unless rec.is_a?(Hash)
    { title: rec["title"], md: rec["md"] }
  end
end
