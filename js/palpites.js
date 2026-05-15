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
        // Dentro do if (user) no palpites.js
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const dados = userDoc.data();
            document.getElementById('boas-vindas').innerHTML = `
                Olá, ${dados.nome}! 👋 <br>
                <span style="color: #008000; font-weight: bold;">Sua Pontuação: ${dados.pontos || 0} pts</span>
            `;
        }
        renderizarJogos();
    } else {
        window.location.href = "index.html";
    }
});

async function renderizarJogos() {
    const container = document.getElementById('container-jogos');
    if (!container) return;
    
    container.innerHTML = "<p>Carregando jogos...</p>"; 
    
    // Atualiza o título visual da página
    const titulosFases = {
        1: "Fase de Grupos - Rodada 1",
        2: "Fase de Grupos - Rodada 2",
        3: "Fase de Grupos - Rodada 3",
        4: "16-avos de Final",
        5: "Oitavas de Final",
        6: "Quartas de Final",
        7: "Semifinais",
        8: "Grande Final"
    };
    document.getElementById('titulo-rodada').innerText = titulosFases[rodadaAtual] || `Rodada ${rodadaAtual}`;

    const agora = new Date();
    let jogosParaExibir = [];

    // --- LÓGICA DE BUSCA DE JOGOS ---
    if (rodadaAtual <= 3) {
        // Pega da lista fixa que criamos no jogos.js
        jogosParaExibir = listaJogos.filter(jogo => jogo.rodada === rodadaAtual);
    } else {
        // Pega do Firebase os jogos de mata-mata criados pelo Admin
        const nomesFases = { 4: '16avos', 5: 'oitavas', 6: 'quartas', 7: 'semi', 8: 'final' };
        const faseProcurada = nomesFases[rodadaAtual];
        
        try {
            const q = query(collection(db, "jogos_matamata"), where("fase", "==", faseProcurada));
            const snap = await getDocs(q);
            snap.forEach(d => {
                jogosParaExibir.push(d.data());
            });
        } catch (erro) {
            console.error("Erro ao buscar mata-mata:", erro);
        }
    }

    if (jogosParaExibir.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px;">Os confrontos desta fase ainda não foram definidos pelo administrador.</p>`;
        return;
    }

    // --- LÓGICA DE RENDERIZAÇÃO ---
    container.innerHTML = ""; 

    // Agrupamos por grupo apenas se for fase de grupos
    if (rodadaAtual <= 3) {
        const grupos = {};
        jogosParaExibir.forEach(jogo => {
            if (!grupos[jogo.grupo]) grupos[jogo.grupo] = [];
            grupos[jogo.grupo].push(jogo);
        });

        for (const [nomeGrupo, jogos] of Object.entries(grupos)) {
            let htmlGrupo = `<div class="grupo-caixa">
                <h4 class="grupo-titulo">Grupo ${nomeGrupo}</h4>
                <div class="classificacao-palpite" id="classif-${nomeGrupo}">
                    ${gerarSeletoresClassificacao(nomeGrupo)}
                </div><hr>`;
            
            jogos.forEach(jogo => htmlGrupo += montarCardJogo(jogo, agora));
            htmlGrupo += `</div>`;
            container.innerHTML += htmlGrupo;
        }
    } else {
        // No mata-mata, mostramos os jogos em uma lista simples (sem caixas de grupo)
        let htmlMata = `<div class="grupo-caixa"><h4 class="grupo-titulo">${titulosFases[rodadaAtual]}</h4>`;
        jogosParaExibir.forEach(jogo => htmlMata += montarCardJogo(jogo, agora));
        htmlMata += `</div>`;
        container.innerHTML += htmlMata;
    }

    // Carrega os palpites salvos para preencher os inputs
    carregarPalpites();
}

// FUNÇÃO AUXILIAR PARA CRIAR O HTML DE CADA JOGO
function montarCardJogo(jogo, agora) {
    const dataJogo = new Date(jogo.dataInicio);
    const jaComecou = agora >= dataJogo;
    
    // Tradutor de emoji para sigla (mantendo a lógica que fizemos antes)
    const emojiParaSigla = { "🇲🇽": "mx", "🇿🇦": "za", "🇰🇷": "kr", "🇨🇿": "cz", "🇨🇦": "ca", "🇧🇦": "ba", "🇶🇦": "qa", "🇨🇭": "ch", "🇧🇷": "br", "🇲🇦": "ma", "🇭🇹": "ht", "🏴󠁧󠁢󠁳󠁣󠁴󠁿": "gb-sct", "🇺🇸": "us", "🇵🇾": "py", "🇦🇺": "au", "🇹🇷": "tr", "🇩🇪": "de", "🇨🇼": "cw", "🇨🇮": "ci", "🇪🇨": "ec", "🇳🇱": "nl", "🇯🇵": "jp", "🇸🇪": "se", "🇹🇳": "tn", "🇧🇪": "be", "🇪🇬": "eg", "🇮🇷": "ir", "🇳🇿": "nz", "🇪🇸": "es", "🇨🇻": "cv", "🇸🇦": "sa", "🇺🇾": "uy", "🇫🇷": "fr", "🇸🇳": "sn", "🇮🇶": "iq", "🇳🇴": "no", "🇦🇷": "ar", "🇩🇿": "dz", "🇦🇹": "at", "🇯🇴": "jo", "🇵🇹": "pt", "🇨🇩": "cd", "🇺🇿": "uz", "🇨🇴": "co", "🏴󠁧󠁢󠁥󠁮󠁧󠁿": "gb-eng", "🇭🇷": "hr", "🇬🇭": "gh", "🇵🇦": "pa" };

    // Se for mata-mata, talvez o Admin tenha escrito o nome do time sem emoji, 
    // então verificamos se a bandeira existe no dicionário.
    const siglaA = emojiParaSigla[jogo.bandeiraA] || "un";
    const siglaB = emojiParaSigla[jogo.bandeiraB] || "un";

    const horario = dataJogo.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) + " " + dataJogo.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});

    return `
        <div class="jogo-card ${jaComecou ? 'bloqueado' : ''}">
            <div class="info-jogo">${horario} ${jogo.multiplicador > 1 ? `<strong>(Peso x${jogo.multiplicador})</strong>` : ''}</div>
            <div class="placar-area">
                <div class="time">
                    <img src="https://flagcdn.com/w40/${siglaA}.png" width="25" onerror="this.style.display='none'">
                    <span>${jogo.timeA}</span>
                    <input type="number" min="0" class="placar-input" id="input-${jogo.id}-A" ${jaComecou ? 'disabled' : ''}>
                </div>
                <span class="vs">X</span>
                <div class="time direita">
                    <input type="number" min="0" class="placar-input" id="input-${jogo.id}-B" ${jaComecou ? 'disabled' : ''}>
                    <span>${jogo.timeB}</span>
                    <img src="https://flagcdn.com/w40/${siglaB}.png" width="25" onerror="this.style.display='none'">
                </div>
            </div>
        </div>
    `;
}

// EVENTOS DOS BOTÕES DE PAGINAÇÃO
document.getElementById('btn-rodada-prox')?.addEventListener('click', () => {
    if (rodadaAtual < 8) { // Aumentamos aqui
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
    const posicoesGrupo = {};
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].forEach(g => {
        posicoesGrupo[g] = [
            document.getElementById(`pos-${g}-1`).value,
            document.getElementById(`pos-${g}-2`).value,
            document.getElementById(`pos-${g}-3`).value,
            document.getElementById(`pos-${g}-4`).value
        ];
    });

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
            posicoes: posicoesGrupo, // <--- Salvando as posições
            ultimaAtualizacao: new Date()
        },
 { merge: true });
    } catch (erro) {
        alert("Erro ao salvar.");
    }
});

async function carregarPalpites() {
    try {
        const docSnap = await getDoc(doc(db, "palpites", usuarioLogado.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Carrega placares dos jogos
            if (data.palpites) {
                for (const jogoId in data.palpites) {
                    const inputA = document.getElementById(`input-${jogoId}-A`);
                    const inputB = document.getElementById(`input-${jogoId}-B`);
                    if (inputA && inputB) {
                        inputA.value = data.palpites[jogoId].a;
                        inputB.value = data.palpites[jogoId].b;
                    }
                }
            }

            // Carrega posições dos grupos (NOVIDADE)
            if (data.posicoes) {
                for (const grupo in data.posicoes) {
                    const ordens = data.posicoes[grupo]; // [Time1, Time2, Time3, Time4]
                    ordens.forEach((timeNome, index) => {
                        const select = document.getElementById(`pos-${grupo}-${index + 1}`);
                        if (select) select.value = timeNome;
                    });
                }
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar palpites:", erro);
    }
}

document.getElementById('btn-sair')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

function gerarSeletoresClassificacao(grupo) {
    // Pegamos os times únicos desse grupo
    const timesNoGrupo = [...new Set(listaJogos.filter(j => j.grupo === grupo).flatMap(j => [j.timeA, j.timeB]))];
    
    let html = "";
    for (let i = 1; i <= 4; i++) {
        html += `
            <div class="linha-classif">
                <span>${i}º</span>
                <select id="pos-${grupo}-${i}" class="select-posicao">
                    <option value="">Selecionar Time...</option>
                    ${timesNoGrupo.map(time => `<option value="${time}">${time}</option>`).join('')}
                </select>
            </div>
        `;
    }
    return html;
}