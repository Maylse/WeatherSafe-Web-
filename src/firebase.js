// Import necessary Firebase services
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles
// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuEkWICjaRDWbphecT2Gbvo_l_KC0CSC4",
  authDomain: "weathersafe-5a2c7.firebaseapp.com",
  projectId: "weathersafe-5a2c7",
  storageBucket: "weathersafe-5a2c7.appspot.com",
  messagingSenderId: "225206162416",
  appId: "1:225206162416:web:eea5a02d8ca15f2aa4c335",
  measurementId: "G-DZR4SB3WDP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging (FCM)
const messaging = getMessaging(app);

// Public VAPID Key (Web Push Certificates from Firebase Console)
const VAPID_KEY =
  "BE53qXL30ywUtx63VkQZVgt37Bk3eaNdB6K6WQ3T70cBQgKx89Gcs2gv-x1T5Kya6QXFCuFy_-rcM0rVUu5HgCg";

// Request notification permissions and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log("FCM Token:", token);
      return token;
    } else {
      console.error("Notification permission denied");
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
  }
};

// Listen for foreground messages
onMessage(messaging, (payload) => {
  console.log("Message received in foreground:", payload);

  if (payload?.notification) {
    toast.info(`${payload.notification.title}: ${payload.notification.body}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }
});

export { app, messaging };
