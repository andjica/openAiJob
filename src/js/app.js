import $ from 'dom7';
import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import Routes
import routes from './routes.js';
import store from './store.js';
import App from '../app.f7';

// Lista ruta koje su javne (bez autentifikacije)
const publicRoutes = ['/', '/login', '/register', '/verify', '/profile'];

// Helper: Provera da li je JWT token istekao
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (err) {
    return true;
  }
}

// Inicijalizuj Framework7 aplikaciju
var app = new Framework7({
  name: 'openAiJob',
  theme: 'auto',
  el: '#app',
  component: App,
  store: store,
  routes: routes,
});

// Globalni fetch wrapper za API pozive sa JWT
window.apiFetch = async function (url, options = {}) {
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
      localStorage.removeItem('jwt_token');
      app.dialog.alert('Session expired. Please login again.', () => {
        if (app.views.main?.router) {
          app.views.main.router.navigate('/login');
        }
      });
      return;
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    app.dialog.alert('API Error: ' + error.message);
  }
};

// Globalna provera tokena pri promeni rute
app.on('init', () => {
  const mainRouter = app.views.main?.router;

  if (mainRouter) {
    mainRouter.on('routeChange', (to, from) => {
      const token = localStorage.getItem('jwt_token');

      if (publicRoutes.includes(to.url)) return;

      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('jwt_token');
        mainRouter.navigate('/login');
      }
    });
  }
});