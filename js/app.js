// 1. Importando as ferramentas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEz3x9NpVjnUSbk3F1mmqT3_Yq_9lpHSQ",
  authDomain: "bolao-do-bizzao.firebaseapp.com",
  projectId: "bolao-do-bizzao",
  storageBucket: "bolao-do-bizzao.firebasestorage.app",
  messagingSenderId: "984055906045",
  appId: "1:984055906045:web:2320df29a6bfa04f92c894"
};


// 2. Iniciando o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3. Lógica do Formulário de Login
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (evento) => {
    evento.preventDefault(); // Evita que a página recarregue

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    // Tentando fazer o login
    signInWithEmailAndPassword(auth, email, senha)
        .then((userCredential) => {
            const user = userCredential.user;
            alert("Login feito com sucesso! Bem-vindo(a).");
            // Futuramente, aqui vamos redirecionar para a página de palpites!
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode === 'auth/invalid-credential') {
                alert("E-mail ou senha incorretos. Tente novamente!");
            } else {
                alert("Erro ao fazer login: " + error.message);
            }
        });
});