/* ============================================================
   Firebase init + data helpers — shared by every page.
   Loaded after firebase-app-compat.js, firebase-auth-compat.js,
   firebase-firestore-compat.js, and firebase-config.js.

   Uses the Firebase "compat" SDK on purpose: it works with plain
   <script> tags and no build step, so the site stays a set of
   static files you can host anywhere (Netlify, GitHub Pages, etc).
   ============================================================ */

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

window.PortfolioDB = {

  // ---------------- Auth ----------------
  signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  },
  signOutUser() {
    return auth.signOut();
  },
  onAuthChange(cb) {
    auth.onAuthStateChanged(cb);
  },

  // ---------------- Projects ----------------
  projects: {
    // Realtime listener — cb runs immediately and again on every change
    list(cb) {
      return db.collection('projects').orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
          const items = [];
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
          cb(items);
        }, err => console.error('projects list error:', err));
    },
    add(project) {
      return db.collection('projects').add({
        ...project,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    remove(id) {
      return db.collection('projects').doc(id).delete();
    }
  },

  // ---------------- Posts ----------------
  posts: {
    list(cb) {
      return db.collection('posts').orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
          const items = [];
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
          cb(items);
        }, err => console.error('posts list error:', err));
    },
    add(post) {
      return db.collection('posts').add({
        ...post,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    remove(id) {
      return db.collection('posts').doc(id).delete();
    }
  },

  // ---------------- Skills ----------------
  // Stored as a single document: { "Python": 70, "Java": 40, ... }
  // The list of skills/categories itself lives in the page code,
  // not the database — only the numeric levels are dynamic.
  skills: {
    watch(cb) {
      return db.collection('skills').doc('levels')
        .onSnapshot(doc => cb(doc.exists ? doc.data() : {}),
          err => console.error('skills watch error:', err));
    },
    setLevel(name, value) {
      return db.collection('skills').doc('levels').set(
        { [name]: value }, { merge: true }
      );
    }
  }
};
