// Lógica para el editor de temas (copia)
$(document).ready(function() {
    if ($('#fastyle_editor').length) {
        // Inicializar FASTyle si existe
        if (typeof FASTyle !== 'undefined') {
            FASTyle.init(1, 2);
        } else {
            console.log('FASTyle no está definido, cargando funcionalidad básica');
            initializeThemeEditor();
        }
    }
});

// Funcionalidad básica del editor de temas
function initializeThemeEditor() {
    // Manejar envío del formulario
    $('#fastyle_editor').on('submit', function(e) {
        e.preventDefault();
        console.log('Guardando propiedades del tema...');
        // Simular guardado
        alert('Propiedades del tema guardadas (simulado)');
    });

    // Funcionalidad de búsqueda en assets
    $('input[name="search"]').on('input', function() {
        var searchTerm = $(this).val().toLowerCase();
        $('.assets li').each(function() {
            var text = $(this).text().toLowerCase();
            $(this).toggle(text.includes(searchTerm));
        });
    });

    // Interacción con assets (colores)
    $('.assets li').on('click', function() {
        var type = $(this).data('type');
        var name = $(this).data('name');
        var value = $(this).data('value');
        console.log('Seleccionado:', type, name, value);
        // Aquí se podría aplicar el color o asset seleccionado
    });

    // Mejorar apariencia de selects múltiples
    $('#allowedgroups').on('change', function() {
        console.log('Grupos seleccionados:', $(this).val());
    });
}