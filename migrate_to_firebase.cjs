const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC3yvfgG_UT7FqMpAPdUf7F-i04-ak_Rnk",
  authDomain: "money-matters-2026.firebaseapp.com",
  projectId: "money-matters-2026",
  storageBucket: "money-matters-2026.firebasestorage.app",
  messagingSenderId: "872070736412",
  appId: "1:872070736412:web:f03e4576dfd39a1483cdd9",
  measurementId: "G-615MZKRCFQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log('Reading supabase_backup_latest.json...');
  const data = JSON.parse(fs.readFileSync('./supabase_backup_latest.json', 'utf8'));
  const profiles = data.profiles || [];
  const transactions = data.transactions || [];

  console.log(`Migrating ${profiles.length} profiles to Firestore...`);
  for (const p of profiles) {
    const docId = p.id;
    await setDoc(doc(db, 'profiles', docId), p, { merge: true });
    console.log(`Uploaded profile: ${p.id} (${p.full_name || p.email})`);
  }

  console.log(`Migrating ${transactions.length} transactions to Firestore...`);
  for (const t of transactions) {
    const docId = t.id;
    await setDoc(doc(db, 'transactions', docId), t, { merge: true });
  }

  console.log(`SUCCESS! Migrated ${profiles.length} profiles and ${transactions.length} transactions to Firestore.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
