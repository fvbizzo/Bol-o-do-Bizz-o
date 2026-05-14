import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
// NOVIDADE: Adicionamos collection, query, where e getDocs para pesquisar nomes
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

const authForm = document.getElementById('auth-form');
const linkAlternar = document.getElementById('link-alternar');
const groupNome = document.getElementById('group-nome');
const btnPrincipal = document.getElementById('btn-principal');
const titulo = document.getElementById('titulo-tela');

let modoCadastro = false;

// Alternar entre Login e Cadastro
linkAlternar.addEventListener('click', (e) => {
    e.preventDefault();
    modoCadastro = !modoCadastro;

    if (modoCadastro) {
        titulo.innerText = "Crie sua conta 🏆";
        btnPrincipal.innerText = "Cadastrar no Bolão";
        groupNome.style.display = "block";
        linkAlternar.innerText = "Fazer Login";
    } else {
        titulo.innerText = "Bolão da Copa ⚽";
        btnPrincipal.innerText = "Entrar no Bolão";
        groupNome.style.display = "none";
        linkAlternar.innerText = "Cadastre-se aqui";
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    const nomeInput = document.getElementById('nome');
    const nome = nomeInput ? nomeInput.value.trim() : ""; // o .trim() tira espaços em branco extras

    if (modoCadastro) {
        // --- REGRA 1: Nome não pode ser vazio ---
        if (nome === "") {
            alert("Por favor, digite um nome ou apelido para o ranking.");
            return; // Impede que o código continue
        }

        try {
            // --- REGRA 2: Verificar se o apelido já existe ---
            // Cria a pergunta para o banco: "Existe algum documento com 'nome' igual ao que foi digitado?"
            const q = query(collection(db, "usuarios"), where("nome", "==", nome));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert("Putz, esse apelido já está em uso! Escolha outro para se destacar.");
                return; // Impede que a conta seja criada
            }

            // Se passou pelas regras, criamos a conta!
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Salva o usuário no banco de dados
            await setDoc(doc(db, "usuarios", user.uid), {
                nome: nome,
                email: email
            });

            // Desloga e volta para o login
            await signOut(auth); 
            alert("Conta criada com sucesso! Agora faça login para entrar.");
            modoCadastro = false;
            location.reload(); 

        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar: " + error.message);
        }
    } else {
        // Lógica de Login
        signInWithEmailAndPassword(auth, email, senha)
            .then(() => {
                window.location.href = "palpites.html";
            })
            .catch(error => {
                console.error(error);
                alert("E-mail ou senha incorretos.");
            });
    }
});