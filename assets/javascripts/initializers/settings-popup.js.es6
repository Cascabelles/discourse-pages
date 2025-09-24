import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  // Solo ejecutar en la página de settings del plugin
  if (!window.location.pathname.includes("/admin/site_settings/category/plugins")) return;

  // Esperar a que se cargue la página
  api.onAppEvent("app:ready", () => {
    setTimeout(() => {
      addPopupButton();
    }, 1000); // Esperar un poco para que se cargue el DOM
  });

  function addPopupButton() {
    // Buscar el campo de custom_pages_templates
    const textarea = document.querySelector('textarea[name="custom_pages_templates"]');
    if (!textarea) return;

    // Crear el botón
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary";
    button.textContent = "Editar en Popup";
    button.style.marginBottom = "10px";

    // Insertar el botón antes del textarea
    textarea.parentNode.insertBefore(button, textarea);

    // Evento del botón
    button.addEventListener("click", () => {
      openEditorPopup(textarea);
    });
  }

  function openEditorPopup(textarea) {
    // Crear el modal
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">Editor de Páginas Personalizadas</h4>
            <button type="button" class="close" data-dismiss="modal">&times;</button>
          </div>
          <div class="modal-body">
            <textarea id="popup-editor" class="form-control" rows="20" style="font-family: monospace; white-space: pre;"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="save-popup">Guardar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Llenar el textarea del popup
    const popupTextarea = modal.querySelector("#popup-editor");
    popupTextarea.value = textarea.value;

    // Mostrar el modal
    $(modal).modal("show");

    // Evento de guardar
    modal.querySelector("#save-popup").addEventListener("click", () => {
      textarea.value = popupTextarea.value;
      $(modal).modal("hide");
      modal.remove();
    });

    // Limpiar al cerrar
    $(modal).on("hidden.bs.modal", () => {
      modal.remove();
    });
  }
});