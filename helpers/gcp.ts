import * as admin from 'firebase-admin';

export const firebaseAdmin = (): admin.app.App => {
  if (admin.apps.length) {
    // @ts-ignore
    return admin;
  }
  const secretText = Buffer.from(
    process.env.FIREBASE_CREDENTIALS!,
    'base64',
  ).toString('utf-8');
  const secrets = JSON.parse(secretText);
  admin.initializeApp({
    credential: admin.credential.cert(secrets),
  });
  // @ts-ignore
  return admin;
};

// Declared at cold-start, but only initialized if/when the function executes
let lazyFirestore: admin.firestore.Firestore;
export const firestore = (): admin.firestore.Firestore => {
  if (!lazyFirestore) {
    lazyFirestore = firebaseAdmin().firestore();
    return lazyFirestore;
  }
  return lazyFirestore;
};
