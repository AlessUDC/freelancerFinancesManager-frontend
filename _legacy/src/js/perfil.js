const API_URL = 'http://localhost:8080/api/auth';

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioJson = localStorage.getItem('usuario');
    if (!usuarioJson) {
        window.location.href = '../index.html';
        return;
    }

    const usuarioLocal = JSON.parse(usuarioJson);

    // Función para cargar los datos del usuario
    const cargarDatos = async () => {
        // Primero, mostramos lo que tenemos en LocalStorage (Respaldo inmediato)
        document.getElementById('displayNombreHeader').textContent = usuarioLocal.nombre || 'Usuario';
        document.getElementById('displayEmailHeader').textContent = usuarioLocal.email || '';
        document.getElementById('viewNombre').textContent = usuarioLocal.nombre || '---';
        document.getElementById('viewEmail').textContent = usuarioLocal.email || '---';
        
        // Sincronizamos los inputs también
        document.getElementById('nombre').value = usuarioLocal.nombre || '';
        document.getElementById('email').value = usuarioLocal.email || '';

        try {
            console.log("Intentando conectar con el servidor para el ID:", usuarioLocal.id);
            const response = await fetch(`${API_URL}/${usuarioLocal.id}`);
            
            if (!response.ok) throw new Error("Error en la respuesta del servidor");
            
            const usuario = await response.json();
            console.log("Datos recibidos del servidor:", usuario);

            // Si el servidor responde, actualizamos con datos frescos
            document.getElementById('displayNombreHeader').textContent = usuario.nombre;
            document.getElementById('displayEmailHeader').textContent = usuario.email;
            document.getElementById('viewNombre').textContent = usuario.nombre;
            document.getElementById('viewEmail').textContent = usuario.email;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('email').value = usuario.email;
            
        } catch (error) {
            console.warn('No se pudo sincronizar con el servidor, usando datos locales:', error);
        }
    };

    await cargarDatos();

    // Lógica para mostrar/ocultar edición
    const btnShowEdit = document.getElementById('btnShowEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const infoView = document.getElementById('infoView');
    const editSection = document.getElementById('editSection');

    btnShowEdit.addEventListener('click', () => {
        infoView.style.display = 'none';
        editSection.style.display = 'block';
    });

    btnCancelEdit.addEventListener('click', () => {
        infoView.style.display = 'block';
        editSection.style.display = 'none';
    });

    // Actualizar perfil
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        console.log("Enviando datos de actualización:", updatedData);

        try {
            const response = await fetch(`${API_URL}/${usuarioLocal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                const newUser = await response.json();
                console.log("Servidor respondió con usuario actualizado:", newUser);
                
                // Actualizamos el almacenamiento local con la respuesta fresca
                localStorage.setItem('usuario', JSON.stringify(newUser));
                
                // Actualizamos nuestra variable local para futuras peticiones
                Object.assign(usuarioLocal, newUser);

                alert('¡Perfil actualizado correctamente!');
                await cargarDatos();
                
                // Volver a la vista de información
                infoView.style.display = 'block';
                editSection.style.display = 'none';
            } else {
                const errorMsg = await response.text();
                alert('Error al actualizar: ' + errorMsg);
            }
        } catch (error) {
            console.error('Error en la petición PUT:', error);
            alert('Error de conexión con el servidor.');
        }
    });

    // Eliminar cuenta
    document.getElementById('btnDelete').addEventListener('click', async () => {
        if (confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente todos tus datos financieros.')) {
            try {
                const response = await fetch(`${API_URL}/${usuarioLocal.id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Cuenta eliminada con éxito.');
                    localStorage.removeItem('usuario');
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.error('Error al eliminar:', error);
            }
        }
    });
});
