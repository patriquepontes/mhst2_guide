// js/main.js

let allMonsters = [];
let filters = {
    search: '',
    region: 'all'
};

const IMAGE_EXCEPTIONS = {
    "Fatalis": "_Unknown.webp"
};

const HABITAT_CORRECTION_MAP = {
    "Hakolo Island": "Hakolo Island",
    "Alcala": "Alcala Highlands",
    "Loloska": "Loloska Forest",
    "Lamure": "Lamure Desert",
    "Terga": "Terga Volcano",
    "Alcala Highlands": "Alcala Highlands",
    "Loloska Forest": "Loloska Forest",
    "Lamure Desert": "Lamure Desert",
    "Terga Volcano": "Terga Volcano",
    "Fuji Snowfields": "Fuji Snowfields",
    "Lulucion": "Lulucion",
    "Mt. Ena Lava Caves": "Mt. Ena Lava Caves",
    "Pomore Garden": "Pomore Garden",
    "Guardian Ratha Woods": "Guardian Ratha Woods",
    "Elder's Lair": "Elder's Lair",
    "Unknown": "Unknown"
};

document.addEventListener('DOMContentLoaded', async () => {
    allMonsters = await loadMonsters();
    if (allMonsters.length === 0) return;
    
    // Ordenação alfabética
    allMonsters.sort((a, b) => {
        const nameA = MONSTER_NAME_TRANSLATIONS[a.name] || a.name;
        const nameB = MONSTER_NAME_TRANSLATIONS[b.name] || b.name;
        return nameA.localeCompare(nameB);
    });

    initFilters();
    renderMonsters(allMonsters);
    initTheme();
});

async function loadMonsters() {
    try {
        const res = await fetch('data/monsters.json');
        if (!res.ok) throw new Error();

        const rawText = await res.text();
        const cleanText = rawText.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*)/g, (match, group1) => {
            return group1 ? "" : match;
        });

        return JSON.parse(cleanText);

    } catch (e) {
        console.error("Erro ao processar o JSON:", e);
        document.getElementById('loading').innerHTML = 'Erro ao carregar dados dos monstros.';
        return [];
    }
}

function invertAttackPatterns(patternsObj) {
    if (!patternsObj || typeof patternsObj !== "object") return patternsObj;
    const inverted = {};
    for (const state in patternsObj) {
        const type = patternsObj[state]?.toLowerCase();
        if (type === "technical") inverted[state] = "power";
        else if (type === "power") inverted[state] = "speed";
        else if (type === "speed") inverted[state] = "technical";
        else inverted[state] = type;
    }
    return inverted;
}

// --- FUNÇÃO PARA GERAR HTML DAS PARTES E ARMAS ---
function generatePartsHTML(monsterParts) {
    if (!monsterParts || Object.keys(monsterParts).length === 0) {
        return '<p style="text-align:center; font-size:0.9em; color:var(--text-secondary);">Sem informações de partes.</p>';
    }

    let html = '<div class="parts-container">';
    
    for (const [partName, weapons] of Object.entries(monsterParts)) {
        const translatedPart = PART_TRANSLATIONS[partName] || partName;
        
        let weaponsHtml = '';
        if (Array.isArray(weapons) && weapons.length > 0) {
            weaponsHtml = weapons.map(weapon => {
                const weaponLower = weapon.toLowerCase(); // 'slash', 'blunt', 'pierce'
                const weaponName = WEAPON_TYPE_TRANSLATIONS[weaponLower] || weapon;
                
                // Caminho exato solicitado: assets/icons/weapon-{tipo}.svg
                return `<img src="assets/icons/weapon-${weaponLower}.svg" 
                             title="${weaponName}" 
                             alt="${weaponName}" 
                             class="weapon-icon-small">`;
            }).join('');
        } else {
            weaponsHtml = '<span style="font-size:0.8em; color:var(--text-secondary);">—</span>';
        }

        html += `
            <div class="part-row">
                <span class="part-name">${translatedPart}</span>
                <div class="part-weaknesses">${weaponsHtml}</div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function createMonsterCard(monster, index) {
    const combatData = monster.monster || {};
    const nomeOriginal = monster.name;
    const nomeTraduzido = MONSTER_NAME_TRANSLATIONS[nomeOriginal] || nomeOriginal;
    
    const rawHabitat = monster.habitat;
    const normalizedHabitatKey = HABITAT_CORRECTION_MAP[rawHabitat] || rawHabitat || '__NULL_REGION__';
    const regiao = REGION_TRANSLATIONS[normalizedHabitatKey] || normalizedHabitatKey;

    const weaknessRaw = combatData.elementalWeakness;
    let weaknessKey = "None";
    if (typeof weaknessRaw === "string" && weaknessRaw.trim()) {
        weaknessKey = weaknessRaw.charAt(0).toUpperCase() + weaknessRaw.slice(1).toLowerCase();
    } else if (typeof weaknessRaw === "object" && weaknessRaw !== null) {
        weaknessKey = weaknessRaw["DEFAULT"] ? weaknessRaw["DEFAULT"].charAt(0).toUpperCase() + weaknessRaw["DEFAULT"].slice(1) : "None";
    }
    const fraqueza = ELEMENT_TRANSLATIONS[weaknessKey] || "—";

    let attackStatesHTML = '';
    const invertedPatterns = invertAttackPatterns(combatData.attackPatterns || {});
    const patternEntries = Object.entries(invertedPatterns);

    if (patternEntries.length > 0) {
        patternEntries.forEach(([stateRaw, typeRaw]) => {
            let stateName = ATTACK_STATE_TRANSLATIONS[stateRaw] || stateRaw;
            if (stateRaw === 'DEFAULT') stateName = 'Padrão';

            const typeLower = typeRaw ? typeRaw.toLowerCase() : "none";
            const typeCapitalized = typeLower.charAt(0).toUpperCase() + typeLower.slice(1);
            const ataqueTranslate = ATTACK_TRANSLATIONS[typeCapitalized] || ATTACK_TRANSLATIONS[typeLower] || "—";
            
            attackStatesHTML += `
                <div class="info-row attack-state-row">
                    <span class="info-label">${stateName}:</span>
                    <div class="attack-display">
                        <img src="assets/icons/${typeLower}.svg" alt="${ataqueTranslate}" width="24" height="24">
                        <span>${ataqueTranslate}</span>
                    </div>
                </div>`;
        });
    } else {
        attackStatesHTML = `
            <div class="info-row attack-state-row">
                <span class="info-label">Ataque:</span>
                <div class="attack-display">
                    <img src="assets/icons/none.svg" alt="Sem padrão" width="24" height="24">
                    <span>—</span>
                </div>
            </div>`;
    }
    
    const iconFile = IMAGE_EXCEPTIONS[nomeOriginal] || `${nomeOriginal}.webp`;
    const iconPath = `assets/monster_icons/${iconFile}`;

    let ovoHTML = '';
    if (monster.hatchable) {
        const eggPath = `assets/monster_eggs/${nomeOriginal}.svg`;
        ovoHTML = `<img src="${eggPath}" class="egg-icon-only" alt="Ovo de ${nomeTraduzido}" 
                        loading="lazy" width="80" height="80" 
                        style="object-fit:contain;">`;
    }
    
    // GERAÇÃO DO HTML DAS PARTES
    const partsHTML = generatePartsHTML(combatData.parts);

    // Adiciona o evento onclick="toggleCard(this)"
    return `
    <div class="monster-card" onclick="toggleCard(this)">
        <div class="card-image-section">
            <img src="${iconPath}" 
                 alt="${nomeTraduzido}" 
                 class="monster-icon-main" 
                 loading="lazy"
                 width="80" height="80"
                 style="object-fit:contain;"
                 onerror="this.src='assets/monster_icons/_Unknown.webp'">

            ${ovoHTML}
        </div>

        <div class="name-header"><h2 class="monster-name">${nomeTraduzido}</h2></div>
        <p class="monster-region">Região: ${regiao}</p>

        <div class="monster-info">
            ${attackStatesHTML} 
            
            <div class="info-row">
                <span class="info-label">Fraqueza:</span>
                <div class="weakness-display">
                    <img src="assets/icons/${weaknessKey.toLowerCase()}.svg" alt="${fraqueza}" width="24" height="24">
                    <span>${fraqueza}</span>
                </div>
            </div>
        </div>

        <div class="monster-details">
            <div class="parts-title">Partes Quebráveis & Fraquezas</div>
            ${partsHTML}
        </div>
    </div>`;
}

// --- FUNÇÃO PARA ABRIR/FECHAR O CARD ---
function toggleCard(element) {
    element.classList.toggle('active');
}

function initFilters() {
    const regionFilter = document.getElementById('region-filter');
    const searchInput = document.getElementById('search-input');

    if (!regionFilter || !searchInput) return;

    const uniqueHabitats = new Set();
    allMonsters.forEach(m => {
        const raw = m.habitat;
        const norm = HABITAT_CORRECTION_MAP[raw] || raw || '__NULL_REGION__';
        uniqueHabitats.add(norm);
    });

    let regionOptions = '<option value="all">Todas as Regiões</option>'; 
    
    ORDEM_REGIOES.forEach(key => { 
        if (uniqueHabitats.has(key)) {
            const label = REGION_TRANSLATIONS[key] || key;
            regionOptions += `<option value="${key}">${label}</option>`; 
            uniqueHabitats.delete(key);
        }
    });
    
    uniqueHabitats.forEach(key => {
        const label = REGION_TRANSLATIONS[key] || key;
        regionOptions += `<option value="${key}">${label}</option>`;
    });

    regionFilter.innerHTML = regionOptions;

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
        const translatedName = MONSTER_NAME_TRANSLATIONS[monster.name] || monster.name;
        const nome = translatedName.toLowerCase();
        
        const rawHabitat = monster.habitat;
        const habitat = HABITAT_CORRECTION_MAP[rawHabitat] || rawHabitat || '__NULL_REGION__';
        
        if (filters.search && !nome.includes(filters.search)) return false;
        
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
    if(btn) btn.textContent = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';

    if(btn) {
        btn.onclick = () => {
            const novo = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', novo);
            localStorage.setItem('theme', novo);
            btn.textContent = novo === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        };
    }
}