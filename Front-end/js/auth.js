// Front-end/js/auth.js

// Obtener token de localStorage
function getToken() {
    return localStorage.getItem('access_token');
}

// Guardar token en localStorage
function saveToken(token) {
    localStorage.setItem('access_token', token);
}

// Eliminar token (logout)
function removeToken() {
    localStorage.removeItem('access_token');
}

// Verificar si hay sesión activa
function isAuthenticated() {
    return !!getToken();
}

// Logout (llamar al backend)
async function logout() {
    const token = getToken();

    if (token) {
        try {
            // Llamar al endpoint de logout
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }

    removeToken();
    window.location.href = 'login.html';
}

// Interceptar todas las peticiones fetch para agregar token
const originalFetch = window.fetch;
window.fetch = function (...args) {
    let [url, config] = args;

    // No agregar token a peticiones de login/register
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
        return originalFetch.apply(this, args);
    }

    // Agregar Authorization header
    const token = getToken();
    if (token) {
        config = config || {};
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return originalFetch.apply(this, [url, config])
        .then(response => {
            // Si el servidor responde 401, token inválido
            if (response.status === 401) {
                // Mostrar alerta si la sesión fue cerrada
                if (response.statusText.includes('dispositivo') ||
                    response.headers.get('X-Session-Error') === 'session_closed') {
                    alert('Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo.');
                }

                console.warn('Token inválido, redirigiendo a login...');
                removeToken();
                window.location.href = 'login.html';
            }
            return response;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
};

// Proteger páginas
function protectPage() {
    if (!isAuthenticated()) {
        console.warn('No autenticado, redirigiendo a login...');
        window.location.href = 'login.html';
    }
}

console.log('Auth system loaded with single session support');