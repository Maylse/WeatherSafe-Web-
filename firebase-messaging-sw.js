importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDuEkWICjaRDWbphecT2Gbvo_l_KC0CSC4",
  authDomain: "weathersafe-5a2c7.firebaseapp.com",
  projectId: "weathersafe-5a2c7",
  storageBucket: "weathersafe-5a2c7.appspot.com",
  messagingSenderId: "225206162416",
  appId: "1:225206162416:web:eea5a02d8ca15f2aa4c335",
  measurementId: "G-DZR4SB3WDP",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png",
  });
});
