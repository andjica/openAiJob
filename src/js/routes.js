import HomePage from "../pages/home.f7";
import MainPage from "../pages/main.f7";
import ProfilePage from "../pages/profile.f7";
import ActiveJob from "../pages/activeJob.f7";
import SearchJobsPage from "../pages/searchJob.f7";
import ChatPage from "../pages/chats.f7";
import AiPage from "../pages/ai.f7";

import RegisterPage from "../pages/register.f7";
import LoginPage from "../pages/login.f7";
import VerifyPage from "../pages/verify.f7";

import NotFoundPage from "../pages/404.f7";

var routes = [
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/login/",
    component: LoginPage,
  },
  {
    path: "/register/",
    component: RegisterPage,
  },
  {
    path: "/verify/",
    component: VerifyPage,
  },
  {
    path: "/home/",
    component: HomePage,
  },
  {
    path: "/main/",
    component: MainPage,
  },
  {
    path: "/profile/",
    component: ProfilePage,
  },
  {
    path: "/job/:id",
    component: ActiveJob,
  },
  {
    path: "/searchJob/",
    component: SearchJobsPage,
  },
  {
    path: "/chats/",
    component: ChatPage,
  },
  {
    path: "/ai/",
    component: AiPage,
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
