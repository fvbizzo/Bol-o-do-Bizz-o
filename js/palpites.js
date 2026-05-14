import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { listaJogos } from "./jogos.js";

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

let usuarioLogado = null;
let rodadaAtual = 1; // NOVA VARIÁVEL: Controla a página que estamos vendo

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioLogado = user;
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists() && document.getElementById('boas-vindas')) {
            document.getElementById('boas-vindas').innerText = "Olá, " + userDoc.data().nome + "! 👋";
        }
        renderizarJogos();
    } else {
        window.location.href = "index.html";
    }
});

// DESENHAR JOGOS (Agora dividindo por grupos e rodadas)
function renderizarJogos() {
    const container = document.getElementById('container-jogos');
    if (!container) return;
    
    container.innerHTML = ""; 
    document.getElementById('titulo-rodada').innerText = "Rodada " + rodadaAtual;

    const agora = new Date();
    
    // Filtra apenas os jogos da rodada que queremos ver
    const jogosDaRodada = listaJogos.filter(jogo => jogo.rodada === rodadaAtual);

    // Organiza esses jogos em "gavetas" com o nome de cada grupo
    const grupos = {};
    jogosDaRodada.forEach(jogo => {
        if (!grupos[jogo.grupo]) grupos[jogo.grupo] = [];
        grupos[jogo.grupo].push(jogo);
    });

    // Para cada grupo (A, B, C...), cria uma caixinha e coloca os jogos dentro
    for (const [nomeGrupo, jogos] of Object.entries(grupos)) {
        let grupoHTML = `
            <div class="grupo-caixa">
                <h4 class="grupo-titulo">Grupo ${nomeGrupo}</h4>
        `;

        jogos.forEach(jogo => {
            const dataJogo = new Date(jogo.dataInicio);
            const jaComecou = agora >= dataJogo;

            // Formatação do horário para exibir na tela
            const horarioFormatado = dataJogo.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + " às " + dataJogo.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

            grupoHTML += `
                <div class="jogo-card ${jaComecou ? 'bloqueado' : ''}">
                    <div class="info-jogo">${horarioFormatado}</div>
                    <div class="placar-area">
                        <div class="time">
                            <span>${jogo.bandeiraA} ${jogo.timeA}</span>
                            <input type="number" min="0" class="placar-input" id="input-${jogo.id}-A" ${jaComecou ? 'disabled' : ''}>
                        </div>
                        <span class="vs">X</span>
                        <div class="time direita">
                            <input type="number" min="0" class="placar-input" id="input-${jogo.id}-B" ${jaComecou ? 'disabled' : ''}>
                            <span>${jogo.timeB} ${jogo.bandeiraB}</span>
                        </div>
                    </div>
                    ${jaComecou ? '<span class="aviso-bloqueio">Bloqueado</span>' : ''}
                </div>
            `;
        });

        grupoHTML += `</div>`; // Fecha a caixa do grupo
        container.innerHTML += grupoHTML;
    }

    // Como recriamos o HTML da tela, precisamos chamar a função para preencher os valores salvos de novo!
    carregarPalpites();
}

// EVENTOS DOS BOTÕES DE PAGINAÇÃO
document.getElementById('btn-rodada-prox')?.addEventListener('click', () => {
    if (rodadaAtual < 3) {
        rodadaAtual++;
        renderizarJogos();
    }
});

document.getElementById('btn-rodada-ant')?.addEventListener('click', () => {
    if (rodadaAtual > 1) {
        rodadaAtual--;
        renderizarJogos();
    }
});

// SALVAR PALPITES (A mesma lógica de antes, mas não apaga palpites de outras rodadas)
document.getElementById('btn-salvar')?.addEventListener('click', async () => {
    if (!usuarioLogado) return;
    const todosPalpites = {};
    const agora = new Date();

    listaJogos.forEach(jogo => {
        const dataJogo = new Date(jogo.dataInicio);
        if (agora < dataJogo) {
            const inputA = document.getElementById(`input-${jogo.id}-A`);
            const inputB = document.getElementById(`input-${jogo.id}-B`);
            if (inputA && inputB && inputA.value !== "" && inputB.value !== "") {
                todosPalpites[jogo.id] = { a: parseInt(inputA.value), b: parseInt(inputB.value) };
            }
        }
    });

    try {
        await setDoc(doc(db, "palpites", usuarioLogado.uid), {
            palpites: todosPalpites,
            ultimaAtualizacao: new Date()
        }, { merge: true });
        alert(`Palpites salvos! Vá para a próxima rodada!`);
    } catch (erro) {
        alert("Erro ao salvar.");
    }
});

// CARREGAR PALPITES (Igual ao anterior)
async function carregarPalpites() {
    try {
        const docSnap = await getDoc(doc(db, "palpites", usuarioLogado.uid));
        if (docSnap.exists() && docSnap.data().palpites) {
            const data = docSnap.data().palpites;
            for (const jogoId in data) {
                const inputA = document.getElementById(`input-${jogoId}-A`);
                const inputB = document.getElementById(`input-${jogoId}-B`);
                if (inputA && inputB) {
                    inputA.value = data[jogoId].a;
                    inputB.value = data[jogoId].b;
                }
            }
        }
    } catch (erro) {}
}

document.getElementById('btn-sair')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});