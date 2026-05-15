import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Suas chaves reais inseridas aqui!
const firebaseConfig = {
  apiKey: "AIzaSyAEz3x9NpVjnUSbk3F1mmqT3_Yq_9lpHSQ",
  authDomain: "bolao-do-bizzao.firebaseapp.com",
  projectId: "bolao-do-bizzao",
  storageBucket: "bolao-do-bizzao.firebasestorage.app",
  messagingSenderId: "984055906045",
  appId: "1:984055906045:web:2320df29a6bfa04f92c894"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    if (user) {
        carregarRanking();
    } else {
        window.location.href = "index.html";
    }
});

async function carregarRanking() {
    const corpoRanking = document.getElementById('corpo-ranking');
    if (!corpoRanking) return;

    corpoRanking.innerHTML = "<tr><td colspan='3'>Carregando classificação...</td></tr>";

    try {
        const q = query(collection(db, "usuarios"), orderBy("pontos", "desc"));
        const querySnapshot = await getDocs(q); // A variável é definida AQUI
        
        corpoRanking.innerHTML = "";
        let posicao = 1;

        querySnapshot.forEach((doc) => {
            const usuario = doc.data();
            const SEU_EMAIL_ADMIN = "seu-email@gmail.com"; // Ajuste seu e-mail aqui

            if (usuario.nome && usuario.email !== SEU_EMAIL_ADMIN) {
                const row = `
                    <tr class="${posicao === 1 ? 'primeiro-lugar' : ''}">
                        <td>${posicao}º</td>
                        <td>${usuario.nome}</td>
                        <td><strong>${usuario.pontos || 0}</strong></td>
                    </tr>
                `;
                corpoRanking.innerHTML += row;
                posicao++;
            }
        });
    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
        corpoRanking.innerHTML = "<tr><td colspan='3'>Erro ao carregar. Verifique o console.</td></tr>";
    }
}

document.getElementById('btn-sair')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});