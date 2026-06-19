const API_URL = 'http://localhost:8080/api/auth';

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('¡Login exitoso!');
            // Guardamos el usuario en localStorage para usarlo en el dashboard
            localStorage.setItem('usuario', JSON.stringify(data));
            window.location.href = 'dashboard.html';
        } else {
            alert('Error: ' + (data.message || 'Credenciales incorrectas'));
        }
    } catch (error) {
        console.error('Error en la petición:', error);
        alert('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
    }
});
