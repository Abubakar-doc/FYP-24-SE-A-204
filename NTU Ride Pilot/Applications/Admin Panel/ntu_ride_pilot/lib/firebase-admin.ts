import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth }                     from 'firebase-admin/auth';
import { getFirestore }                from 'firebase-admin/firestore';
import { getMessaging }                from 'firebase-admin/messaging';

// your existing serviceAccount + initialization…
const serviceAccount = {
  projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let app: App;
if (!getApps().length) {
  app = initializeApp({ credential: cert(serviceAccount) });
} else {
  app = getApp();
}

export { app };
export const adminAuth     = getAuth(app);
export const adminDb       = getFirestore(app);
export const adminMessaging = getMessaging(app);
