import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEz3x9NpVjnUSbk3F1mmqT3_Yq_9lpHSQ",
  authDomain: "bolao-do-bizzao.firebaseapp.com",
  projectId: "bolao-do-bizzao",
  storageBucket: "bolao-do-bizzao.firebasestorage.app",
  messagingSenderId: "984055906045",
  appId: "1:984055906045:web:2320df29a6bfa04f92c894"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Seletores do Novo HTML (Vídeos)
const areaLogin = document.getElementById('area-login');
const areaCadastro = document.getElementById('area-cadastro');
const linkIrParaCadastro = document.getElementById('ir-para-cadastro');
const linkIrParaLogin = document.getElementById('ir-para-login');

// --- 1. Alternar entre as Telas ---
linkIrParaCadastro?.addEventListener('click', (e) => {
    e.preventDefault();
    areaLogin.style.display = 'none';
    areaCadastro.style.display = 'block';
});

linkIrParaLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    areaCadastro.style.display = 'none';
    areaLogin.style.display = 'block';
});

// --- 2. Lógica de LOGIN ---
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            window.location.href = "palpites.html";
        })
        .catch(error => {
            console.error(error);
            alert("E-mail ou senha incorretos.");
        });
});

// --- 3. Lógica de CADASTRO (Com suas regras de apelido) ---
document.getElementById('btn-cadastrar')?.addEventListener('click', async () => {
    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;

    // Regra: Nome não pode ser vazio
    if (nome === "") {
        alert("Por favor, digite um nome ou apelido para o ranking.");
        return;
    }

    try {
        // Regra: Verificar se o apelido já existe
        const q = query(collection(db, "usuarios"), where("nome", "==", nome));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert("Putz, esse apelido já está em uso! Escolha outro.");
            return;
        }

        // Criar conta no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Salvar no Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: nome,
            email: email,
            pontos: 0
        });

        alert("Conta criada com sucesso! Agora faça login.");
        location.reload(); // Recarrega para voltar à tela de login

    } catch (error) {
        console.error(error);
        alert("Erro ao cadastrar: " + error.message);
    }
});