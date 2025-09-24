// ...existing code...
(function(){
	// Helper: safe parse JSON or YAML-like (try JSON only for simplicity)
	function parseTemplates(raw){
		if(!raw) return {};
		try{ return JSON.parse(raw); }catch(e){
			// try to fix common YAML-style by replacing single quotes -> double and unquoted keys (very naive)
			try{ return (new Function('return ('+raw+')'))(); }catch(e2){ console.warn('custom_pages_templates parse error', e2); return {}; }
		}
	}

	// Read templates from SiteSettings (Discourse provides SiteSettings global)
	var raw = window.SiteSettings && window.SiteSettings.custom_pages_templates;
	var templates = parseTemplates(raw);
	var editor = templates && templates.editor;
	if(!editor) return; // nothing to do

	// Build floating button
	function t(key, fallback){
		try{ return window.I18n && I18n.t(key) || fallback; }catch(e){ return fallback; }
	}

	var btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'custom-pages-editor-launch';
	btn.setAttribute('aria-label', t('site_settings.custom_pages_editor_button', 'Abrir editor'));
	btn.textContent = t('site_settings.custom_pages_editor_button', 'Abrir editor');
	Object.assign(btn.style, {
		position: 'fixed',
		right: '20px',
		bottom: '20px',
		zIndex: 9999,
		background:'#0ea5e9',
		color:'#fff',
		border:'none',
		padding:'10px 14px',
		borderRadius:'8px',
		boxShadow:'0 6px 18px rgba(2,6,23,0.2)',
		cursor:'pointer'
	});

	document.addEventListener('DOMContentLoaded', function(){
		document.body.appendChild(btn);
	});

	// Modal builder
	function openModal(tpl){
		// overlay
		var overlay = document.createElement('div');
		overlay.className = 'custom-pages-overlay';
		Object.assign(overlay.style, {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'});

		var container = document.createElement('div');
		container.className = 'custom-pages-modal';
		Object.assign(container.style,{width:'min(1100px,100%)',maxHeight:'90vh',overflow:'auto',background:'#fff',borderRadius:'8px',boxShadow:'0 10px 40px rgba(2,6,23,0.3)',position:'relative',padding:'0'});

		// header
		var header = document.createElement('div');
		header.style.padding = '12px 16px';
		header.style.borderBottom = '1px solid #eee';
		header.style.display = 'flex';
		header.style.justifyContent = 'space-between';
		header.style.alignItems = 'center';
		var title = document.createElement('strong');
		title.textContent = tpl.title || t('site_settings.custom_pages_editor_title','editor');
		title.style.fontSize = '16px';
		header.appendChild(title);
		var close = document.createElement('button');
		close.innerHTML = '\u2715';
		Object.assign(close.style,{background:'transparent',border:'none',fontSize:'18px',cursor:'pointer'});
		close.addEventListener('click', closeModal);
		header.appendChild(close);

		// content area where we inject html + css
		var contentWrap = document.createElement('div');
		contentWrap.className = 'custom-pages-content-wrap';
		contentWrap.style.padding = '16px';

		// Insert CSS into a style tag scoped to the modal
		if(tpl.css){
			var styleTag = document.createElement('style');
			styleTag.className = 'custom-pages-editor-style';
			styleTag.textContent = tpl.css;
			container.appendChild(styleTag);
		}

		// For security, create an isolated iframe when mode is iframe, otherwise inject HTML inline
		if(tpl.mode === 'iframe'){
			var iframe = document.createElement('iframe');
			iframe.style.width = '100%';
			iframe.style.height = '60vh';
			iframe.style.border = 'none';
			// write to iframe
			document.addEventListener('DOMContentLoaded', function(){
				try{
					container.appendChild(iframe);
					var doc = iframe.contentWindow.document;
					doc.open();
					doc.write('<!doctype html><html><head><meta charset="utf-8"><title>'+ (tpl.title||'') +'</title>' + (tpl.css?'<style>'+tpl.css+'<\/style>':'') + '</head><body>' + (tpl.html||'') + (tpl.js?'<script>'+tpl.js+'<\/script>':'') + '</body></html>');
					doc.close();
				}catch(e){ console.warn('iframe write failed', e); }
			});
		}else{
			// inline
			var inner = document.createElement('div');
			inner.className = 'custom-pages-inline';
			inner.innerHTML = tpl.html || '';
			contentWrap.appendChild(inner);
			// append JS after DOM nodes
			if(tpl.js){
				setTimeout(function(){
					try{ var fn = new Function(tpl.js); fn(); }catch(e){ console.warn('editor js error', e); }
				}, 50);
			}
		}

		container.appendChild(header);
		container.appendChild(contentWrap);
		overlay.appendChild(container);
		document.body.appendChild(overlay);

		// Close on click outside
		overlay.addEventListener('click', function(e){ if(e.target === overlay) closeModal(); });

		function closeModal(){
			if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
		}
	}

	btn.addEventListener('click', function(){ openModal(editor); });

})();
