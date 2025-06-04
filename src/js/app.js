import Framework7, { getDevice } from "framework7/bundle";

// Import F7 Styles
import "framework7/css/bundle";

// Import Icons and App Custom Styles
import "../css/icons.css";
import "../css/app.css";

// Import Routes
import routes from "./routes.js";
import store from "./store.js";
import App from "../app.f7";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Lista ruta koje su javne (bez autentifikacije)
const publicRoutes = ["/", "/login", "/register", "/verify", "/profile"];

let device = getDevice();
// Helper: Provera da li je JWT token istekao
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (err) {
    return true;
  }
}

// Inicijalizuj Framework7 aplikaciju
var app = new Framework7({
  name: "openAiJob",
  theme: "auto",
  el: "#app",
  component: App,
  store: store,
  routes: routes,
  input: {
    scrollIntoViewOnFocus: device.cordova,
    scrollIntoViewCentered: device.cordova,
  },
  statusbar: {
    iosOverlaysWebView: true,
    androidOverlaysWebView: true,
  },
  on: {
    init: function () {
      if (window.cordova) cordovaApp.init(this);
    },
  },
});
app.on("pageInit", () => {
  const mainRouter = app.views.main?.router;
  // alert(3);
  if (mainRouter) {
    mainRouter.on("routeChange", (to, from) => {
      const token = localStorage.getItem("jwt_token");

      if (publicRoutes.includes(to.url)) return;

      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("jwt_token");
        mainRouter.navigate("/login");
        return;
      }

      window.initEcho();

      const chatRouteMatch = to.url.match(/^\/chatroom\/([^/]+)\/?$/);
      if (chatRouteMatch) {
        const chatId = chatRouteMatch[1];
        localStorage.setItem("active_chat_id", chatId);
        console.log("🟢 Ušao u chat sa ID: " + chatId);
      }
    });
  }

  app.on("pageBeforeOut", (page) => {
    if (page.route.url && page.route.url.includes("/chatroom/")) {
      localStorage.setItem("active_chat_id", 0);
      console.log("🚪 Napustio chat – obrisan active_chat_id");
    }
  });
});
window.Pusher = Pusher;
let echoInitialized = false;

window.initEcho = function () {
  const token = localStorage.getItem("jwt_token");

  if (!token || echoInitialized) return;

  if (window.Echo && window.Echo.connector) {
    try {
      window.Echo.disconnect();
    } catch (e) {}
  }

  window.Pusher = Pusher;

  window.Echo = new Echo({
    broadcaster: "pusher",
    key: "localkey",
    cluster: "mt1",
    wsHost: "127.0.0.1",
    wsPort: 6001,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ["ws"],
    authEndpoint: "http://127.0.0.1:8000/api/broadcasting/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // document.addEventListener("deviceready", () => {
  //   const ws = new WebSocket(
  //     "ws://api.unisharp.nl:6001/app/local?protocol=7&client=js&version=8.4.0&flash=false"
  //   );

  //   ws.onopen = () => alert("✅ WebSocket connected iz APK!");
  //   ws.onerror = (e) => alert("❌ WebSocket error: " + JSON.stringify(e));
  // });

  window.Echo.connector.pusher.connection.bind("connected", () => {
    console.log("🟢 Echo povezan!");
    initGlobalMessageListener();
  });

  echoInitialized = true;
  console.log("✅ Echo je inicijalizovan sa tokenom:", token);
};

// Globalna provera tokena pri promeni rute

function initGlobalMessageListener() {
  if (window.globalListenerAttached) return;

  const user = JSON.parse(localStorage.getItem("user"));
  console.log("app.js ", user);

  const myId = user?.id;
  console.log("myId: ", myId);
  console.log("🔍 Pozvana initGlobalMessageListener");

  if (window.globalListenerAttached) {
    console.log("⛔ Listener već aktivan – izlazim");
    return;
  }

  console.log("🔍 LocalStorage user:", user);

  if (!user || !user.id) {
    console.log("⛔ Nema user-a ili nema ID – izlazim");
    return;
  }
  console.log("📡 Subscribujem se na chat." + myId);

  console.log("🔊 Listening on chat." + myId);

  window.Echo.private(`chat.${myId}`)
    .listen(".MessageSent", (msg) => {
      console.log("📥 Nova poruka stigla:", msg);
      // alert("poruka");
      // Preskoči ako je poruka od mene (sender) ili ako sam ja receiver ali sam u tom chatu
      if (msg.sender_id === myId) {
        console.log("⏭️ Poruka je poslana od mene – ne brojim kao unread.");
        return;
      }

      // ⛔ Ako smo trenutno u chatu sa tim korisnikom – ne inkrementiraj
      // const activeChatId = parseInt(
      //   localStorage.getItem("active_chat_id") || "0"
      // );

      // console.log(activeChatId);

      // if (msg.sender_id === activeChatId || msg.receiver_id === activeChatId) {
      //   console.log("⏭️ Poruka je iz aktivnog chata – ne brojim kao unread.");
      //   return;
      // }

      let count = parseInt(localStorage.getItem("unread_count")) || 0;
      count++;
      localStorage.setItem("unread_count", count);

      let map = JSON.parse(localStorage.getItem("unread_sender_map") || "{}");
      map[msg.sender_id] = (map[msg.sender_id] || 0) + 1;
      localStorage.setItem("unread_sender_map", JSON.stringify(map));

      window.updateGlobalUnreadBadge?.();
      window.refreshUnreadInMatchRows?.();

      if (typeof window.chatAddMessageUI === "function") {
        window.chatAddMessageUI(msg);
      }
    })
    .error((err) => console.error("❌ Echo error:", err));

  window.globalListenerAttached = true;
}

// 🔴 UNREAD BADGE
window.updateGlobalUnreadBadge = function () {
  let count = parseInt(localStorage.getItem("unread_count")) || 0;
  let unreadMap = JSON.parse(localStorage.getItem("unread_sender_map") || "{}");

  const myId = JSON.parse(localStorage.getItem("user"))?.id;

  // Ukloni unread count za sebe (poruke koje si ti poslao)
  if (myId && unreadMap[myId]) {
    count -= unreadMap[myId]; // oduzmi od ukupnog count-a
    delete unreadMap[myId]; // ukloni iz mape
  }

  // Update localStorage da bude konzistentno
  localStorage.setItem("unread_count", count);
  localStorage.setItem("unread_sender_map", JSON.stringify(unreadMap));

  const badges = document.getElementsByClassName("unread-badge");

  for (let i = 0; i < badges.length; i++) {
    badges[i].textContent = count > 0 ? count : "";
    badges[i].style.display = count > 0 ? "inline-block" : "none";
  }

  document.querySelectorAll(".match-row").forEach((row) => {
    const btn = row.querySelector("a[data-id]");
    const id = btn?.dataset?.id;
    if (id && unreadMap[id]) {
      let span = btn.querySelector(".unread-count");
      if (!span) {
        span = document.createElement("span");
        span.className = "unread-count";
        btn.appendChild(span);
      }
      span.textContent = `${unreadMap[id]} new`;
      row.querySelector(".name").style.fontWeight = "bold";
    }
  });
};

window.refreshUnreadInMatchRows = function () {
  window.updateGlobalUnreadBadge();
};

// 🔄 UNREAD COUNT FETCH
window.updateUnreadCount = async function () {
  try {
    const activeChatId = parseInt(
      localStorage.getItem("active_chat_id") || "0"
    );

    // ⛔ Ako si trenutno u chatu – ne resetuj badge!
    if (window.location.href.includes("/chatroom/") && activeChatId) {
      console.log("⏭️ Skip updateUnreadCount – u chatu si");
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(
      "http://127.0.0.1:8000/api/messages/total/unread/count",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    console.log("data: ", data);
    localStorage.setItem("unread_count", data.success ? data.count : 0);

    const res2 = await fetch('http://127.0.0.1:8000/api/messages/unread/count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data2 = await res2.json();
    console.log("data2: ",data2);
    if (data2.success) {
      localStorage.setItem("unread_sender_map", JSON.stringify(data2.unread_senders));
    }

    window.updateGlobalUnreadBadge();
  } catch (err) {
    console.error("❌ updateUnreadCount error:", err);
  }
};
