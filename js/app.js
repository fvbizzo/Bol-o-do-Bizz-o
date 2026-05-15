import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// --- CONFIGURAÇÃO ---
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

// --- ELEMENTOS DA INTERFACE ---
const areaLogin = document.getElementById('area-login');
const areaCadastro = document.getElementById('area-cadastro');
const linkIrParaCadastro = document.getElementById('ir-para-cadastro');
const linkIrParaLogin = document.getElementById('ir-para-login');

// --- CONTROLE DE TELAS ---
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

// --- LÓGICA DE LOGIN ---
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        // O redirecionamento agora é tratado pelo onAuthStateChanged para maior segurança
    } catch (error) {
        console.error(error);
        alert("E-mail ou senha incorretos.");
    }
});

// --- LÓGICA DE CADASTRO ---
document.getElementById('btn-cadastrar')?.addEventListener('click', async () => {
    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;

    if (nome === "" || email === "" || senha === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        // Verificar se o apelido já existe
        const q = query(collection(db, "usuarios"), where("nome", "==", nome));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert("Putz, esse apelido já está em uso! Escolha outro.");
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Salvar no Firestore (isAdmin sempre false por padrão no cadastro via web)
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: nome,
            email: email,
            pontos: 0,
            isAdmin: false 
        });

        alert("Conta criada com sucesso!");
        window.location.href = "palpites.html";

    } catch (error) {
        console.error(error);
        alert("Erro ao cadastrar: " + error.message);
    }
});

// --- MONITOR DE ESTADO (SEGURANÇA ATIVA) ---
// Esta função verifica quem logou e decide para onde enviar o usuário
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const dados = userDoc.data();
            
            // Se o usuário já estiver na index e logar, manda para a página certa
            if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
                // Se for admin, você pode escolher se quer mandá-lo direto para o admin ou palpites
                window.location.href = "palpites.html";
            }
        }
    }
});