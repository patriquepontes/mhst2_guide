// main.js – GUIA MHST2 FINAL (SVGs + ORDEM OFICIAL + SÓ ÍCONES)

let allMonsters = [];

// Ordem oficial das regiões no bestiário do jogo
const ORDEM_OFICIAL_REGIOES = [
    "Pomore Garden", "Hakolo Island", "Alcala Highlands", "Arbia Forest",
    "Loloska Forest", "Harzgai Rocky Canyon", "Jalma Highlands", "Terga Volcano",
    "Lamure Desert", "Lulucion", "Nua Te Village", "Mt. Ena Lava Caves",
    "Fuji Snowfields", "Forbidden Grounds", "Elder's Lair", "Tower of Illusion"
];

document.addEventListener('DOMContentLoaded', async () => {
    allMonsters = await loadMonsters();
    if (allMonsters.length === 0) return;

    const regioesExistentes = [...new Set(allMonsters.map(m => m.region))];
    const ordemFinal = ORDEM_OFICIAL_REGIOES
        .filter(r => regioesExistentes.includes(r))
        .concat(regioesExistentes.filter(r => !ORDEM_OFICIAL_REGIOES.includes(r)));

    window.sortByRegion = (a, b) => {
        const ia = ordemFinal.indexOf(a.region);
        const ib = ordemFinal.indexOf(b.region);
        if (ia !== ib) return ia - ib;
        return a.name.localeCompare(b.name);
    };

    allMonsters.sort(window.sortByRegion);

    initFilters(allMonsters, ordemFinal);
    renderMonsters(allMonsters);
    initTheme();
});

async function loadMonsters() {
    try {
        const res = await fetch('data/monsters.json');
        if (!res.ok) throw new Error();
        return await res.json();
    } catch {
        document.getElementById('loading').textContent = 'Erro ao carregar dados. Use Live Server!';
        return [];
    }
}

function createMonsterCard(monster, index) {
    const { 
        name, 
        region, 
        attackStates = [], 
        weaknesses = [] 
    } = monster;

    // ←←← PROTEÇÃO TOTAL (nunca mais vai dar erro) ←←←
    const safeAttackStates = Array.isArray(attackStates) && attackStates.length > 0
        ? attackStates
        : [{ state: "Padrão", type: "—" }];

    const mainWeakness = weaknesses[0]?.element || '—';
    const weaknessChanged = weaknesses.some(w => w.element !== mainWeakness);
    const alteredWeakness = weaknessChanged
        ? weaknesses.find(w => w.element !== mainWeakness)?.element || '—'
        : null;

    return `
        <div class="monster-card" style="animation-delay:${index * 0.03}s">
            <div class="name-header"><h2 class="monster-name">${name}</h2></div>
            <p class="monster-region">Região: ${region}</p>
            <div class="monster-info">
                <div class="info-row">
                    <span class="info-label">Fraqueza:</span>
                    <span class="info-value"><span class="icon icon-${normalize(mainWeakness)}"></span></span>
                </div>

                <!-- Todos os estados — liberdade total e à prova de falhas -->
                ${safeAttackStates.map(s => `
                <div class="info-row">
                    <span class="info-label">${s.state}:</span>
                    <span class="info-value"><span class="icon icon-${normalize((s.type || "").split(' ')[0])}"></span></span>
                </div>`).join('')}

                ${alteredWeakness ? `
                <div class="info-row">
                    <span class="info-label">Fraqueza alterada:</span>
                    <span class="info-value"><span class="icon icon-${normalize(alteredWeakness)}"></span></span>
                </div>` : ''}
            </div>
        </div>`;
}

function normalize(str) {
    if (!str) return 'none';
    const map = {
        fogo:'fire', água:'water', agua:'water', trovão:'thunder', trovao:'thunder',
        gelo:'ice', dragão:'dragon', dragao:'dragon', 'não-elemental':'none',
        técnica:'technical', tecnica:'technical', força:'power', forca:'power',
        rápido:'speed', rapido:'speed'
    };
    const clean = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return map[clean] || 'none';
}

function initFilters(monsters, ordemRegioes) {
    const rf = document.getElementById('region-filter');
    const wf = document.getElementById('weakness-filter');
    const af = document.getElementById('attack-filter');
    const si = document.getElementById('search-input');

    rf.innerHTML = '<option value="">Todas as regiões</option>';
    wf.innerHTML = '<option value="">Todas as fraquezas</option>';
    af.innerHTML = '<option value="">Todos os ataques</option>';

    ordemRegioes.forEach(r => {
        const o = document.createElement('option');
        o.value = r; o.textContent = r;
        rf.appendChild(o);
    });

    [...new Set(monsters.flatMap(m => m.weaknesses.map(w => w.element)))].sort().forEach(w => {
        const o = document.createElement('option'); o.value = w; o.textContent = w; wf.appendChild(o);
    });

    ['Técnica','Força','Rápido'].forEach(a => {
        const o = document.createElement('option'); o.value = a; o.textContent = a; af.appendChild(o);
    });

    const apply = () => filterAndRender(allMonsters);
    rf.onchange = wf.onchange = af.onchange = apply;
    si.oninput = apply;
}

function filterAndRender(all) {
    const s = document.getElementById('search-input').value.toLowerCase().trim();
    const r = document.getElementById('region-filter').value;
    const w = document.getElementById('weakness-filter').value;
    const a = document.getElementById('attack-filter').value;

    let filtered = all.filter(m => {
        if (s && !m.name.toLowerCase().includes(s)) return false;
        if (r && m.region !== r) return false;
        if (w && !m.weaknesses.some(x => x.element === w)) return false;
        if (a && !m.attackStates.some(x => x.type === a)) return false;
        return true;
    });

    filtered.sort(window.sortByRegion);
    renderMonsters(filtered);
}

function renderMonsters(m) {
    const c = document.getElementById('monsters-container');
    const cnt = document.getElementById('results-count');
    document.getElementById('loading').style.display='none';
    if(m.length===0){
        c.innerHTML='<div class="monster-card"><p style="text-align:center;color:var(--text-secondary)">Nenhum monstro encontrado</p></div>';
        cnt.textContent='';
        return;
    }
    c.innerHTML = m.map((mon,i)=>createMonsterCard(mon,i)).join('');
    cnt.textContent = `${m.length} monstro${m.length>1?'s':''} encontrado${m.length>1?'s':''}`;
}

function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'light';
    if(saved==='dark'){ html.setAttribute('data-theme','dark'); btn.textContent='Modo Claro'; }
    btn.onclick = () => {
        const isDark = html.getAttribute('data-theme')==='dark';
        html.setAttribute('data-theme', isDark?'light':'dark');
        btn.textContent = isDark?'Modo Escuro':'Modo Claro';
        localStorage.setItem('theme', isDark?'light':'dark');
    };
}