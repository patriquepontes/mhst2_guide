// main.js – GUIA DEFINITIVO MHST2 (2025)

let allMonsters = [];

// Mapa de tradução das regiões
const REGION_TRANSLATIONS = {
    "Pomore Garden": "Jardim de Pomore",
    "Hakolo Island": "Ilha de Hakolo",
    "Alcala Highlands": "Terras Altas de Alcala",
    "Arbia Forest": "Floresta de Albia",
    "Loloska Forest": "Floresta de Loloska",
    "Harzgai Rocky Canyon": "Cânion Rochoso de Harzgai",
    "Jalma Highlands": "Terras Altas de Jalma",
    "Terga Volcano": "Vulcão de Terga",
    "Lamure Desert": "Deserto de Lamure",
    "Lulucion": "Lulucion",
    "Nua Te Village": "Vila Nua Te",
    "Mt. Ena Lava Caves": "Cavernas de Lava do Monte Ena",
    "Fuji Snowfields": "Campos Nevados de Fuji",
    "Forbidden Grounds": "Terrenos Proibidos",
    "Elder's Lair": "Toca do Ancião",
    "Tower of Illusion": "Torre da Ilusão",
    // Caso haja regiões personalizadas no JSON
    "Chefes / Monstros Reais": "Chefes / Monstros Reais" 
};


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
        if (!res.ok) throw new Error("JSON não encontrado");
        return await res.json();
    } catch (e) {
        console.error("Erro:", e);
        document.getElementById('loading').textContent = 'Erro: Verifique se está usando Live Server e se o JSON está em /data/monsters.json';
        return [];
    }
}

function createMonsterCard(monster, index) {
    const { name, region, attackStates = [], rideType } = monster;

    // NOVO: Usa a tradução da região, mas se não encontrar, usa o nome original (region)
    const translatedRegion = REGION_TRANSLATIONS[region] || region; 

    const safeAttackStates = Array.isArray(attackStates) && attackStates.length > 0
        ? attackStates : [{ state: "Padrão", type: "—" }];

    return `
        <div class="monster-card" style="animation-delay:${index * 0.03}s">
            <div class="name-header"><h2 class="monster-name">${name}</h2></div>
            <p class="monster-region">Região: ${translatedRegion}</p>
            <div class="monster-info">

                ${safeAttackStates.map(s => `
                <div class="info-row attack-row">
                    <span class="info-label">${s.state}:</span>
                    <div class="attack-display">
                        <span class="icon icon-${normalize(s.type)}"></span>
                        <span class="attack-text">${s.type || "—"}</span>
                    </div>
                </div>`).join('')}

                ${rideType ? `
                <div class="info-row">
                    <span class="info-label">Montaria:</span>
                    <div class="ride-display">
                        <span class="icon icon-${normalize(rideType)}"></span>
                        <span class="ride-text">${rideType}</span>
                    </div>
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
    return map[str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'none';
}

function initFilters(monsters, ordemRegioes) {
    const rf = document.getElementById('region-filter');
    const af = document.getElementById('attack-filter');
    const si = document.getElementById('search-input');
    
    // CORREÇÃO DE ACESSIBILIDADE
    rf.setAttribute('aria-label', 'Filtrar por Região');
    af.setAttribute('aria-label', 'Filtrar por Tipo de Ataque');
    si.setAttribute('aria-label', 'Caixa de Pesquisa de Monstros');
    // FIM DA CORREÇÃO

    rf.innerHTML = '<option value="">Todas as regiões</option>';
    af.innerHTML = '<option value="">Todos os ataques</option>';

    ordemRegioes.forEach(r => {
        // NOVO: Exibe o nome traduzido (REGION_TRANSLATIONS[r]), mas usa o nome original (r) como 'value' para a filtragem
        const translatedName = REGION_TRANSLATIONS[r] || r;
        const o = new Option(translatedName, r); 
        rf.add(o);
    });

    ['Técnica','Força','Rápido'].forEach(a => af.add(new Option(a, a)));

    const apply = () => filterAndRender(allMonsters);
    rf.onchange = af.onchange = si.oninput = apply;
}

function filterAndRender(all) {
    const s = document.getElementById('search-input').value.toLowerCase().trim();
    const r = document.getElementById('region-filter').value;
    const a = document.getElementById('attack-filter').value;

    let filtered = all.filter(m => {
        if (s && !m.name.toLowerCase().includes(s)) return false;
        if (r && m.region !== r) return false;
        if (a && !m.attackStates?.some(x => x.type === a)) return false;
        
        return true;
    });

    filtered.sort(window.sortByRegion);
    renderMonsters(filtered);
}

function renderMonsters(m) {
    const c = document.getElementById('monsters-container');
    const cnt = document.getElementById('results-count');
    document.getElementById('loading').style.display = 'none';

    if (!m.length) {
        c.innerHTML = '<div class="monster-card"><p style="text-align:center;color:var(--text-secondary)">Nenhum monstro encontrado</p></div>';
        cnt.textContent = '';
        return;
    }

    c.innerHTML = m.map((mon, i) => createMonsterCard(mon, i)).join('');
    cnt.textContent = `${m.length} monstro${m.length > 1 ? 's' : ''} encontrado${m.length > 1 ? 's' : ''}`;
}

function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', saved);
    btn.textContent = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';

    btn.onclick = () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        btn.textContent = newTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        localStorage.setItem('theme', newTheme);
    };
}