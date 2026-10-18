// Connexion Firebase (Auth + Firestore) — chargé avant app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const emit = detail => { window.NLEFB.state = detail; window.dispatchEvent(new CustomEvent("nle-auth", {detail})); };
window.NLEFB = {state: null};

if (!firebaseConfig || !firebaseConfig.apiKey) {
  emit({error: "Configuration Firebase manquante : ajoute la variable FIREBASE_WEB_CONFIG dans GitHub puis relance le déploiement."});
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  let db;
  try { db = initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}); }
  catch (e) { db = initializeFirestore(app, {}); }
  const wrap = s => ({docs: s.docs.map(d => ({id: d.id, exists: true, data: () => d.data()}))});
  Object.assign(window.NLEFB, {
    async signIn(email, pass, keep) {
      await setPersistence(auth, keep ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
    },
    signOut: () => signOut(auth),
    watch(c, cb, err) { return onSnapshot(collection(db, c), s => cb(wrap(s)), e => { console.error(e); err && err(e); }); },
    set: (c, id, v) => setDoc(doc(db, c, id), v),
    del: (c, id) => deleteDoc(doc(db, c, id)),
    list: async c => (await getDocs(collection(db, c))).docs.map(d => d.data()),
    lock: name => runTransaction(db, async tx => {
      const r = doc(db, "locks", name), s = await tx.get(r), now = Date.now();
      if (s.exists() && s.data().until > now) return false;
      tx.set(r, {until: now + 8000, by: auth.currentUser ? auth.currentUser.uid : ""});
      return true;
    }).catch(() => false)
  });
  onAuthStateChanged(auth, async user => {
    if (!user) { emit(null); return; }
    try {
      const m = await getDoc(doc(db, "members", user.uid));
      if (!m.exists()) { await signOut(auth); emit({error: "Ce compte n'est pas autorisé. Identifiant à autoriser : " + user.uid}); return; }
      emit({uid: user.uid, name: m.data().name || user.email});
    } catch (e) {
      emit({error: "Accès refusé par la base (" + (e.code || "erreur") + "). Vérifie que ton compte est bien dans « members »."});
    }
  });
}
