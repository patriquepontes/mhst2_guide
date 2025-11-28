// js/main.js – GUIA MHST2 2025 – FINAL E PERFEITO

let allMonsters = [];
let filters = {
    search: '',
    region: 'all'
};

// MAPA PARA CORRIGIR INCONSISTÊNCIAS ENTRE JSON (curto) e TRANSLATIONS (longo)
const HABITAT_CORRECTION_MAP = {
    // Mapeamentos curtos (do JSON) para longos (do Translation/Filtro)
    "Hakolo Island": "Hakolo Island",
    "Alcala": "Alcala Highlands",
    "Loloska": "Loloska Forest",
    "Lamure": "Lamure Desert",
    "Terga": "Terga Volcano",

    // GARANTIA: Mapeia as chaves longas para si mesmas para evitar problemas de correspondência
    "Alcala Highlands": "Alcala Highlands",
    "Loloska Forest": "Loloska Forest",
    "Lamure Desert": "Lamure Desert",
    "Terga Volcano": "Terga Volcano",
    "Fuji Snowfields": "Fuji Snowfields",
    "Lulucion": "Lulucion",
    "Mt. Ena Lava Caves": "Mt. Ena Lava Caves"
};


document.addEventListener('DOMContentLoaded', async () => {
    allMonsters = await loadMonsters();
    if (allMonsters.length === 0) return;
    
    // A função populateAttackStateTranslations foi removida e o mapa global será usado diretamente.
    
    allMonsters.sort((a, b) => {
        // Normaliza habitat antes da ordenação
        const normalizedRegA = HABITAT_CORRECTION_MAP[a.habitat] || a.habitat;
        const normalizedRegB = HABITAT_CORRECTION_MAP[b.habitat] || b.habitat;
        
        const regA = normalizedRegA || '__NULL_REGION__';
        const regB = normalizedRegB || '__NULL_REGION__';
        
        // Coloca regiões desconhecidas/null por último na ordenação
        const idxA = ORDEM_REGIOES.indexOf(regA);
        const idxB = ORDEM_REGIOES.indexOf(regB);
        
        // Se algum não está na ORDEM_REGIOES, assume a última posição (999)
        if (idxA !== idxB) {
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        }
        
        return (a.nameTranslate || a.name).localeCompare(b.nameTranslate || b.name);
    });

    initFilters();
    renderMonsters(allMonsters);
    initTheme();
});

async function loadMonsters() {
    try {
        const res = await fetch('data/monsters.json');
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        document.getElementById('loading').innerHTML = 'Erro ao carregar monsters.json';
        return [];
    }
}


function createMonsterCard(monster, index) {
    const nome = monster.nameTranslate || monster.name;
    
    // Normaliza habitat
    const rawHabitatKey = monster.habitat;
    const normalizedHabitatKey = HABITAT_CORRECTION_MAP[rawHabitatKey] || rawHabitatKey;

    const habitatKey = normalizedHabitatKey || '__NULL_REGION__';
    const regiao = REGION_TRANSLATIONS[habitatKey] || "Desconhecida";

    // Fraqueza
    const weaknessRaw = monster.elementalWeakness;
    let weaknessKey = "None";
    if (typeof weaknessRaw === "string" && weaknessRaw.trim()) {
        weaknessKey = weaknessRaw.charAt(0).toUpperCase() + weaknessRaw.slice(1).toLowerCase();
    } else if (weaknessRaw === null) { 
        weaknessKey = "None";
    }
    const fraqueza = ELEMENT_TRANSLATIONS[weaknessKey] || "—";

    // LÓGICA PARA EXIBIR TODOS OS ESTADOS DE ATAQUE
    let attackStatesHTML = '';
    const hasAttackStates = Array.isArray(monster.attackStates) && monster.attackStates.length > 0;

    if (hasAttackStates) {
        monster.attackStates.forEach(state => {
            // USA O NOVO OBJETO GLOBAL ATTACK_STATE_TRANSLATIONS
            const stateName = ATTACK_STATE_TRANSLATIONS[state.state] || state.state;
            const attackType = state.type || "None";
            const ataqueTranslate = ATTACK_TRANSLATIONS[attackType] || "—";
            
            // Cria uma nova linha para cada estado
            attackStatesHTML += `
                <div class="info-row attack-state-row">
                    <span class="info-label">${stateName}:</span>
                    <div class="attack-display">
                        <img src="assets/icons/${attackType.toLowerCase()}.svg" onerror="this.src='assets/icons/none.svg'">
                        <span>${ataqueTranslate}</span>
                    </div>
                </div>`;
        });
    } else {
        // Exibe "Ataque: —" para monstros sem attackStates (e.g., Kelbi)
        attackStatesHTML = `
            <div class="info-row attack-state-row">
                <span class="info-label">Ataque:</span>
                <div class="attack-display">
                    <img src="assets/icons/none.svg" onerror="this.src='assets/icons/none.svg'">
                    <span>—</span>
                </div>
            </div>`;
    }
    
    // LÓGICA DO OVO
    const isMonstie = hasAttackStates; 
    const eggEntry = isMonstie && monster_eggs && monster_eggs[monster.name];
    const eggFilePath = eggEntry?.file; 

    const ovoHTML = eggFilePath
        ? `<img src="assets/${eggFilePath}" class="egg-icon-only" alt="Ovo" style="width:80px;height:80px;object-fit:contain;">`
        : '';
    
    return `
    <div class="monster-card" style="animation-delay:${index * 0.04}s">
        <div class="card-image-section">
            <img src="assets/monster_icons/${monster.name}.webp" 
                 alt="${nome}" 
                 class="monster-icon-main" 
                 style="width:80px;height:80px;object-fit:contain;"
                 onerror="this.src='assets/monster_icons/_Unknown.webp'">

            ${ovoHTML}
        </div>

        <div class="name-header"><h2 class="monster-name">${nome}</h2></div>
        <p class="monster-region">Região: ${regiao}</p>

        <div class="monster-info">
            ${attackStatesHTML} 
            
            <div class="info-row">
                <span class="info-label">Fraqueza:</span>
                <div class="weakness-display">
                    <img src="assets/icons/${weaknessKey.toLowerCase()}.svg" onerror="this.src='assets/icons/none.svg'">
                    <span>${fraqueza}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function initFilters() {
    // Referência aos selects
    const regionFilter = document.getElementById('region-filter');
    const searchInput = document.getElementById('search-input');

    if (!regionFilter || !searchInput) {
        console.error("Um ou mais elementos de filtro não foram encontrados no DOM.");
        return;
    }

    // --- 1. POPULAR FILTRO DE REGIÃO (HABITAT) ---
    const uniqueHabitats = new Set();
    allMonsters.forEach(m => {
        const rawHabitat = m.habitat;
        const normalizedHabitat = HABITAT_CORRECTION_MAP[rawHabitat] || rawHabitat;
        uniqueHabitats.add(normalizedHabitat || '__NULL_REGION__');
    });

    let regionOptions = '<option value="all">Todas as Regiões</option>'; 
    
    ORDEM_REGIOES.forEach(key => { 
        if (uniqueHabitats.has(key)) {
            regionOptions += `<option value="${key}">${REGION_TRANSLATIONS[key]}</option>`; 
            uniqueHabitats.delete(key);
        }
    });
    
    if (uniqueHabitats.has('__NULL_REGION__')) {
        regionOptions += `<option value="__NULL_REGION__">${REGION_TRANSLATIONS['__NULL_REGION__']}</option>`; 
    }

    regionFilter.innerHTML = regionOptions;

    // --- 2. ADICIONAR LISTENERS
    searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.toLowerCase().trim();
        filterAndRender();
    });

    regionFilter.addEventListener('change', (e) => {
        filters.region = e.target.value;
        filterAndRender();
    });
}

function filterAndRender() {
    const listaFiltrada = allMonsters.filter(monster => {
        const nome = (monster.nameTranslate || monster.name).toLowerCase();
        
        // Habitat (para filtro de Região)
        const rawHabitatKey = monster.habitat;
        const normalizedHabitatKey = HABITAT_CORRECTION_MAP[rawHabitatKey] || rawHabitatKey;
        const habitat = normalizedHabitatKey || '__NULL_REGION__';
        
        // 1. Filtro de Pesquisa por Nome
        if (filters.search && !nome.includes(filters.search)) {
            return false;
        }

        // 2. Filtro de Região
        if (filters.region !== 'all' && habitat !== filters.region) {
            return false;
        }

        return true;
    });

    renderMonsters(listaFiltrada);
}

function renderMonsters(lista) {
    const container = document.getElementById('monsters-container');
    const contador = document.getElementById('results-count');
    document.getElementById('loading').style.display = 'none';

    if (!lista.length) {
        container.innerHTML = '<div class="monster-card"><p style="text-align:center;color:var(--text-secondary)">Nenhum monstro encontrado</p></div>';
        contador.textContent = '';
        return;
    }

    container.innerHTML = lista.map((m, i) => createMonsterCard(m, i)).join('');
    contador.textContent = `${lista.length} monstro${lista.length > 1 ? 's' : ''} encontrado${lista.length > 1 ? 's' : ''}`;
}

function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', saved);
    btn.textContent = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';

    btn.onclick = () => {
        const novo = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', novo);
        localStorage.setItem('theme', novo);
        btn.textContent = novo === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    };
}