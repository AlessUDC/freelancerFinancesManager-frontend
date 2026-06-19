const API_URL = 'http://localhost:8080/api/auth';

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
            window.location.href = '../index.html';
        } else {
            alert('Error en el registro: ' + (data || 'Inténtalo de nuevo'));
        }
    } catch (error) {
        console.error('Error en la petición:', error);
        alert('No se pudo conectar con el servidor.');
    }
});
