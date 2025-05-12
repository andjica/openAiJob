import $ from 'dom7';
import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import Routes
import routes from './routes.js';
// Import Store
import store from './store.js';

// Import main app component
import App from '../app.f7';

// Lista ruta koje su javne (bez autentifikacije)
const publicRoutes = ['/', '/login', '/register', '/verify'];

// Helper: Provera da li je JWT token istekao
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (err) {
    return true; // Ako token ne može da se dekodira, tretiraj kao istekao
  }
}

// Helper: Globalni fetch wrapper za API pozive sa JWT
window.apiFetch = async function(url, options = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token nevažeći — izbaci korisnika
      localStorage.removeItem('jwt_token');
      app.dialog.alert('Session expired. Please login again.', () => {
        app.router.navigate('/login');
      });
      return;
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    app.dialog.alert('API Error: ' + error.message);
  }
};

// Inicijalizuj Framework7 aplikaciju
var app = new Framework7({
  name: 'openAiJob', // App name
  theme: 'auto', // Automatic theme detection
  el: '#app', // App root element
  component: App, // App main component
  store: store, // App store
  routes: routes, // App routes
});

// Use route change event to handle the authentication check
app.on('routeChange', (to, from) => {
  const token = localStorage.getItem('jwt_token');

  if (publicRoutes.includes(to.route.path)) {
    return; // Skip check for public routes
  }

  if (token && !isTokenExpired(token)) {
    // Proceed with route if token is valid
  } else {
    // Redirect to login if token is expired or missing
    localStorage.removeItem('jwt_token');
    app.router.navigate('/login');
  }
});
