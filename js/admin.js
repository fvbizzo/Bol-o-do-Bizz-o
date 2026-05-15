import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
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
const db = getFirestore(app);
const auth = getAuth(app);

const SEU_EMAIL = "sidocha19@gmail.com";
let rodadaAtual = 1;

onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== SEU_EMAIL) {
        alert("Acesso negado!");
        window.location.href = "palpites.html";
    }
    renderizarAdmin();
});

// 1. DESENHA A TELA PARA INSERIR RESULTADOS
async function renderizarAdmin() {
    const container = document.getElementById('container-admin');
    container.innerHTML = "Carregando...";
    
    // Puxa os resultados reais que já foram salvos
    const resDoc = await getDoc(doc(db, "resultados", "oficiais"));
    const resultadosExistentes = resDoc.exists() ? resDoc.data() : {};

    container.innerHTML = "";
    const jogosDaRodada = listaJogos.filter(j => j.rodada === rodadaAtual);

    jogosDaRodada.forEach(jogo => {
        const resA = resultadosExistentes[jogo.id]?.a ?? "";
        const resB = resultadosExistentes[jogo.id]?.b ?? "";

        container.innerHTML += `
            <div class="jogo-card">
                <div class="placar-area">
                    <span>${jogo.timeA}</span>
                    <input type="number" id="res-${jogo.id}-A" value="${resA}" class="placar-input">
                    <span>X</span>
                    <input type="number" id="res-${jogo.id}-B" value="${resB}" class="placar-input">
                    <span>${jogo.timeB}</span>
                </div>
                <button onclick="window.salvarResultado('${jogo.id}')">OK</button>
            </div>
        `;
    });
}

// 2. FUNÇÃO PARA SALVAR O RESULTADO REAL
window.salvarResultado = async (jogoId) => {
    const a = document.getElementById(`res-${jogoId}-A`).value;
    const b = document.getElementById(`res-${jogoId}-B`).value;

    if (a === "" || b === "") return;

    await setDoc(doc(db, "resultados", "oficiais"), {
        [jogoId]: { a: parseInt(a), b: parseInt(b) }
    }, { merge: true });
    alert("Resultado salvo!");
};

// 3. O "CÉREBRO": CALCULAR PONTOS DE TODO MUNDO
document.getElementById('btn-processar-ranking').addEventListener('click', async () => {
    // 1. Puxa os resultados oficiais (jogos e grupos) uma única vez
    const resJogosDoc = await getDoc(doc(db, "resultados", "oficiais"));
    const resGruposDoc = await getDoc(doc(db, "resultados", "grupos_oficiais"));
    
    const reaisJogos = resJogosDoc.exists() ? resJogosDoc.data() : {};
    const reaisGrupos = resGruposDoc.exists() ? resGruposDoc.data() : {};

    // 2. Busca todos os usuários
    const usuariosSnap = await getDocs(collection(db, "usuarios"));
    
    for (const uDoc of usuariosSnap.docs) {
        const uid = uDoc.id;
        const palpiteDoc = await getDoc(doc(db, "palpites", uid));
        
        let totalPontos = 0;

        if (palpiteDoc.exists()) {
            const dadosPalpite = palpiteDoc.data();

            // --- CÁLCULO DOS JOGOS ---
            if (dadosPalpite.palpites) {
                for (const jogoId in reaisJogos) {
                    if (dadosPalpite.palpites[jogoId]) {
                        totalPontos += calcularPontos(dadosPalpite.palpites[jogoId], reaisJogos[jogoId]);
                    }
                }
            }

            // --- CÁLCULO DOS GRUPOS ---
            if (dadosPalpite.posicoes) {
                for (const letraGrupo in reaisGrupos) {
                    const ordemOficial = reaisGrupos[letraGrupo]; // ["Brasil", "México"...]
                    const ordemUsuario = dadosPalpite.posicoes[letraGrupo]; // ["Brasil", "México"...]

                    if (ordemUsuario) {
                        let acertosNesteGrupo = 0;
                        for (let i = 0; i < 4; i++) {
                            // Verifica se o time na posição i é o mesmo e se não está vazio
                            if (ordemOficial[i] !== "" && ordemUsuario[i] === ordemOficial[i]) {
                                totalPontos += 10;
                                acertosNesteGrupo++;
                            }
                        }
                        // Bônus se acertar os 4 na ordem
                        if (acertosNesteGrupo === 4) {
                            totalPontos += 10;
                        }
                    }
                }
            }
        }

        // 3. Salva o total somado (Jogos + Grupos) no perfil do usuário
        await setDoc(doc(db, "usuarios", uid), { pontos: totalPontos }, { merge: true });
    }
    alert("Ranking atualizado com sucesso! Jogos e Grupos contabilizados.");
});

function calcularPontos(p, r) {
    if (p.a === r.a && p.b === r.b) return 10; // Cheio
    
    const vencedorPalpite = p.a > p.b ? 'A' : (p.a < p.b ? 'B' : 'E');
    const vencedorReal = r.a > r.b ? 'A' : (r.a < r.b ? 'B' : 'E');

    if (vencedorPalpite === vencedorReal) {
        if (p.a === r.a || p.b === r.b) return 7; // Vencedor + 1 placar
        return 5; // Vencedor apenas
    }
    
    if (p.a === r.a || p.b === r.b) return 2; // Consolação
    return 0;
}

// Renderiza a parte de grupos no painel admin
async function renderizarAdminGrupos() {
    const container = document.getElementById('container-admin-grupos');
    const resDoc = await getDoc(doc(db, "resultados", "grupos_oficiais"));
    const gruposOficiais = resDoc.exists() ? resDoc.data() : {};

    const letrasGrupos = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    container.innerHTML = "";

    letrasGrupos.forEach(letra => {
        // Pega os times do grupo letra
        const times = [...new Set(listaJogos.filter(j => j.grupo === letra).flatMap(j => [j.timeA, j.timeB]))];
        const salvo = gruposOficiais[letra] || ["", "", "", ""];

        let html = `
            <div class="grupo-caixa">
                <h4 class="grupo-titulo">Grupo ${letra}</h4>
        `;
        
        for (let i = 1; i <= 4; i++) {
            html += `
                <div class="linha-classif">
                    <span>${i}º</span>
                    <select id="oficial-${letra}-${i}" class="select-posicao">
                        <option value="">-</option>
                        ${times.map(t => `<option value="${t}" ${salvo[i-1] === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
            `;
        }

        html += `<button onclick="window.salvarGrupoOficial('${letra}')" style="margin-top:10px; width:100%">Salvar Grupo ${letra}</button></div>`;
        container.innerHTML += html;
    });
}

// Salva a classificação oficial de um grupo específico
window.salvarGrupoOficial = async (letra) => {
    const ordem = [
        document.getElementById(`oficial-${letra}-1`).value,
        document.getElementById(`oficial-${letra}-2`).value,
        document.getElementById(`oficial-${letra}-3`).value,
        document.getElementById(`oficial-${letra}-4`).value
    ];

    await setDoc(doc(db, "resultados", "grupos_oficiais"), {
        [letra]: ordem
    }, { merge: true });
    alert(`Classificação do Grupo ${letra} salva!`);
};

// Criar jogo de mata-mata
document.getElementById('btn-criar-jogo').addEventListener('click', async () => {
    const fase = document.getElementById('mata-fase').value;
    const timeA = document.getElementById('mata-timeA').value;
    const timeB = document.getElementById('mata-timeB').value;
    const data = document.getElementById('mata-data').value;

    if(!timeA || !timeB || !data) return alert("Preencha tudo!");

    const novoJogo = {
        id: "mata_" + Date.now(), // Gera um ID único
        fase: fase,
        timeA: timeA,
        timeB: timeB,
        dataInicio: new Date(data).toISOString(),
        multiplicador: (fase === 'semi' || fase === 'final') ? 2 : (fase === '16avos' ? 1 : 1.5)
    };

    await setDoc(doc(db, "jogos_matamata", novoJogo.id), novoJogo);
    alert("Jogo de mata-mata criado!");
});

// Ajuste no cálculo de pontos (dentro do seu loop de processar ranking)
// Adicione este bloco dentro do 'for' de cada usuário no admin.js:

const mataSnap = await getDocs(collection(db, "jogos_matamata"));
mataSnap.forEach(mDoc => {
    const jogo = mDoc.data();
    if (reaisJogos[jogo.id] && dadosPalpite.palpites[jogo.id]) {
        const pontosBase = calcularPontos(dadosPalpite.palpites[jogo.id], reaisJogos[jogo.id]);
        totalPontos += Math.round(pontosBase * jogo.multiplicador);
    }
});

// Chame a função no onAuthStateChanged do admin.js
onAuthStateChanged(auth, (user) => {
    if (user && user.email === SEU_EMAIL) {
        renderizarAdmin();
        renderizarAdminGrupos(); // <-- Adicione esta linha
    }
});