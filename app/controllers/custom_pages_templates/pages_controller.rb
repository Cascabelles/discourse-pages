# frozen_string_literal: true

class CustomPagesTemplates::PagesController < ::ApplicationController
  requires_login false
  skip_before_action :check_xhr
  layout false

  def show
    raise Discourse::NotFound unless SiteSetting.custom_pages_enabled

    slug = params[:slug].to_s.sub(%r{/*\z}, "")

    page = lookup_page(slug)
    raise Discourse::NotFound if page.blank?

    title = (page[:title].presence || slug).to_s
    html  = page[:html].to_s
    css   = page[:css].to_s
    js    = page[:js].to_s
    mode  = %w[inline iframe].include?(page[:mode].to_s) ? page[:mode].to_s : "inline"

    # Sugerencia: cache suave basado en valor del setting
    setting_fingerprint = SiteSetting.custom_pages_templates.hash
    response.set_header("Cache-Control", "public, max-age=60")
    response.set_header("ETag", %("#{setting_fingerprint}"))

    if request.headers["If-None-Match"].present? &&
       request.headers["If-None-Match"].delete_prefix('"').delete_suffix('"') == setting_fingerprint.to_s
      head :not_modified and return
    end

    case mode
    when "iframe"
      # Documento incrustado dentro de atributo srcdoc → ESCAPAR TODO EL DOC
      srcdoc_html = build_srcdoc(title: title, html: html, css: css, js: js)
      escaped_srcdoc = ERB::Util.h(srcdoc_html)

      body = <<~HTML
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>#{ERB::Util.h(title)}</title>
          <style>html,body{margin:0;height:100%;}</style>
        </head>
        <body>
          <iframe
            sandbox="allow-scripts allow-forms allow-same-origin"
            style="border:0;width:100%;height:100vh;display:block"
            srcdoc="#{escaped_srcdoc}">
          </iframe>
        </body>
        </html>
      HTML

      render html: body.html_safe, content_type: "text/html"

    else # "inline"
      nonce = content_security_policy_script_nonce
      body = <<~HTML
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>#{ERB::Util.h(title)}</title>
          <style>
          #{css}
          </style>
        </head>
        <body>
          #{html}
          <script nonce="#{nonce}">
          #{js}
          </script>
        </body>
        </html>
      HTML

      render html: body.html_safe, content_type: "text/html"
    end
  end

  private

  def lookup_page(slug)
    raw = SiteSetting.custom_pages_templates.to_s
    return nil if raw.strip.empty?

    data =
      begin
        JSON.parse(raw) # symbolize_names: false por claridad
      rescue JSON::ParserError
        begin
          YAML.safe_load(
            raw,
            permitted_classes: [],
            permitted_symbols: [],
            aliases: false
          ) || {}
        rescue StandardError
          {}
        end
      end

    p = data[slug] || data[slug.to_s]
    return nil unless p.is_a?(Hash)

    {
      title: p["title"],
      mode:  p["mode"],
      html:  p["html"],
      css:   p["css"],
      js:    p["js"]
    }
  end

  # Documento completo para srcdoc
  def build_srcdoc(title:, html:, css:, js:)
    <<~DOC
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>#{ERB::Util.h(title)}</title>
        <style>
        #{css}
        </style>
      </head>
      <body>
        #{html}
        <script>
        #{js}
        </script>
      </body>
      </html>
    DOC
  end
end
