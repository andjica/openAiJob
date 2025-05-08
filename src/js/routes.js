import HomePage from '../pages/home.f7';
import ScreenPage from '../pages/screen.f7';

import RegisterPage from '../pages/register.f7';
import LoginPage from '../pages/login.f7';
import VerifyPage from '../pages/verify.f7';

import NotFoundPage from '../pages/404.f7';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/login/',
    component: LoginPage,
  },
  {
    path: '/register/',
    component: RegisterPage,
  },
  {
    path: '/verify/',
    component: VerifyPage,
  },
  {
    path: '/home/',
    component: HomePage,
  },
  {
    path: '/screen/',
    component: ScreenPage,
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;