# frozen_string_literal: true

class CustomPagesTemplates::PagesController < ::ApplicationController
  requires_login false
  skip_before_action :check_xhr
  skip_before_action :verify_authenticity_token
  layout false  # devolvemos HTML completo sin layout de Discourse

  def show
    raise Discourse::NotFound unless SiteSetting.custom_pages_enabled
    slug = params[:slug].to_s.sub(%r{/*\z}, "")

    page = lookup_page(slug)
    raise Discourse::NotFound if page.blank?

    title = (page[:title].presence || slug).to_s
    html  = page[:html].to_s
    css   = page[:css].to_s
    js    = page[:js].to_s
    mode  = (page[:mode].presence || "inline").to_s

    case mode
    when "iframe"
      # Servimos una shell mínima con iframe sandbox y srcdoc
      srcdoc = build_srcdoc(title: title, html: html, css: css, js: js)
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
            srcdoc='#{srcdoc}'>
          </iframe>
        </body>
        </html>
      HTML

      render html: body.html_safe, content_type: "text/html"

    else # "inline"
      # Renderizamos todo inline con CSP nonce para scripts
      # Nota: el header CSP de Discourse añade 'nonce-...' automáticamente para <script nonce=...>
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
    data =
      begin
        JSON.parse(raw)
      rescue JSON::ParserError
        begin
          YAML.safe_load(raw)
        rescue StandardError
          {}
        end
      end
    p = data[slug] || data[slug.to_s]
    return nil unless p.is_a?(Hash)

    {
      title: p["title"],
      mode: p["mode"],
      html: p["html"],
      css: p["css"],
      js: p["js"]
    }
  end

  # Empaqueta un documento para iframe srcdoc (escapado)
  def build_srcdoc(title:, html:, css:, js:)
    doc = <<~DOC
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

    # Escapar para atributos HTML
    doc.gsub("'", "&apos;").gsub("</", "<\\/")
  end
end
