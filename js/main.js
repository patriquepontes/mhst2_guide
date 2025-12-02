// js/main.js

// --- VARIÁVEIS GLOBAIS ---
let allMonsters = [];
let allGenes = [];
let currentSearchTerm = '';

// --- CONFIGURAÇÕES E MAPAS ---
const IMAGE_EXCEPTIONS = {
    "Fatalis": "_Unknown.webp"
};

const HABITAT_CORRECTION_MAP = {
    "Hakolo Island": "Hakolo Island", "Alcala": "Alcala Highlands", "Loloska": "Loloska Forest",
    "Lamure": "Lamure Desert", "Terga": "Terga Volcano", "Alcala Highlands": "Alcala Highlands",
    "Loloska Forest": "Loloska Forest", "Lamure Desert": "Lamure Desert", "Terga Volcano": "Terga Volcano",
    "Fuji Snowfields": "Fuji Snowfields", "Lulucion": "Lulucion", "Mt. Ena Lava Caves": "Mt. Ena Lava Caves",
    "Pomore Garden": "Pomore Garden", "Guardian Ratha Woods": "Guardian Ratha Woods",
    "Elder's Lair": "Elder's Lair", "Unknown": "Unknown"
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega dados em paralelo
    const [monstersData, genesData] = await Promise.all([
        loadMonsters(),
        loadGenes()
    ]);

    allMonsters = monstersData;
    allGenes = genesData;

    if (allMonsters.length > 0) {
        allMonsters.sort((a, b) => {
            const nameA = MONSTER_NAME_TRANSLATIONS[a.name] || a.name;
            const nameB = MONSTER_NAME_TRANSLATIONS[b.name] || b.name;
            return nameA.localeCompare(nameB);
        });
        initFilters();
    }

    initControls();
    initTheme();
    
    // Renderização inicial
    updateView();
});

// --- CONTROLES DA UI ---
function initControls() {
    const searchInput = document.getElementById('main-search');
    const regionFilter = document.getElementById('region-filter');
    const modeToggle = document.getElementById('mode-toggle');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            updateView();
        });
    }

    if (regionFilter) {
        regionFilter.addEventListener('change', () => {
            updateView();
        });
    }

    if (modeToggle) {
        modeToggle.addEventListener('change', () => {
            updateView();
        });
    }
}

function updateView() {
    const isGeneMode = document.getElementById('mode-toggle').checked;
    const regionSelect = document.getElementById('region-filter');
    const modeText = document.getElementById('mode-text');
    const monstersContainer = document.getElementById('monsters-container');
    const genesContainer = document.getElementById('genes-container');
    const loading = document.getElementById('loading');
    
    if(loading) loading.style.display = 'none';

    if (isGeneMode) {
        modeText.textContent = "Genes";
        regionSelect.classList.add('hidden');
        monstersContainer.classList.add('hidden');
        genesContainer.classList.remove('hidden');
        filterAndRenderGenes();
    } else {
        modeText.textContent = "Monstros";
        regionSelect.classList.remove('hidden');
        monstersContainer.classList.remove('hidden');
        genesContainer.classList.add('hidden');
        filterAndRenderMonsters();
    }
}

// --- LÓGICA DE MONSTROS ---
function filterAndRenderMonsters() {
    const regionValue = document.getElementById('region-filter').value;
    
    const filtered = allMonsters.filter(m => {
        const nameTranslated = (MONSTER_NAME_TRANSLATIONS[m.name] || m.name).toLowerCase();
        const rawHabitat = m.habitat;
        const habitat = HABITAT_CORRECTION_MAP[rawHabitat] || rawHabitat || '__NULL_REGION__';

        if (currentSearchTerm && !nameTranslated.includes(currentSearchTerm)) return false;
        if (regionValue !== 'all' && habitat !== regionValue) return false;

        return true;
    });

    renderMonsters(filtered);
}

function renderMonsters(lista) {
    const container = document.getElementById('monsters-container');
    const contador = document.getElementById('results-count');

    if (!lista.length) {
        container.innerHTML = '<div class="monster-card"><p style="text-align:center;color:var(--text-secondary)">Nenhum monstro encontrado</p></div>';
        if(contador) contador.textContent = '';
        return;
    }

    container.innerHTML = lista.map(createMonsterCard).join('');
    if(contador) contador.textContent = `${lista.length} monstro${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;
}

// --- LÓGICA DE GENES ---
function filterAndRenderGenes() {
    const filtered = allGenes.filter(g => {
        if (!currentSearchTerm) return true;
        const originalName = (g.geneName || "").toLowerCase();
        const translatedName = (GENE_NAME_TRANSLATIONS[g.geneName] || "").toLowerCase();
        return originalName.includes(currentSearchTerm) || translatedName.includes(currentSearchTerm);
    });

    renderGenes(filtered);
}

function renderGenes(lista) {
    const container = document.getElementById('genes-container');
    const contador = document.getElementById('results-count');

    let displayList = lista;
    const limit = 50;
    let showLimitMsg = false;

    if (!currentSearchTerm && lista.length > limit) {
        displayList = lista.slice(0, limit);
        showLimitMsg = true;
    }

    if (!displayList.length) {
        container.innerHTML = '<div class="gene-card"><p style="text-align:center;color:var(--text-secondary)">Nenhum gene encontrado</p></div>';
        if(contador) contador.textContent = '';
        return;
    }

    // Limpa o container e usa appendChild para adicionar os elementos DOM gerados
    container.innerHTML = ''; 
    displayList.forEach(gene => {
        const card = createGeneCardElement(gene);
        container.appendChild(card);
    });
    
    if(contador) {
        let countText = `${lista.length} gene(s) encontrado(s)`;
        if (showLimitMsg) countText += ` (Exibindo os primeiros ${limit})`;
        contador.textContent = countText;
    }
}

// --- MONTAGEM DO ÍCONE DE GENE (NOVA LÓGICA) ---
// --- MONTAGEM DO ÍCONE DE GENE (SPRITE SHEET ATUALIZADO) ---
function createGeneIconDOM(gene) {
    const container = document.createElement('div');
    container.className = 'gene-icon-stack';

    // 1. Base (Fundo) - gene_base.png
    const imgBase = document.createElement('img');
    imgBase.src = 'assets/gene_icons/gene_base.png';
    imgBase.className = 'gene-layer layer-base';
    container.appendChild(imgBase);

    // 2. Elemento (Cor) - gene_fire.png, etc.
    let elemKey = (gene.geneElement || 'non-elem').toLowerCase();
    if (elemKey === 'non-elem') elemKey = 'nonelem'; // Ajuste para nome do arquivo
    
    const imgElem = document.createElement('img');
    imgElem.src = `assets/gene_icons/gene_${elemKey}.png`;
    imgElem.className = 'gene-layer layer-element';
    imgElem.onerror = () => { imgElem.style.display = 'none'; };
    container.appendChild(imgElem);

    // 3. Borda (Tamanho) - gene_border_1.png, etc.
    let borderNum = '1'; // Padrão S
    const name = gene.geneName || '';
    if (name.includes('(M)')) borderNum = '2';
    else if (name.includes('(L)') || name.includes('(XL)')) borderNum = '3';

    const imgBorder = document.createElement('img');
    imgBorder.src = `assets/gene_icons/gene_border_${borderNum}.png`;
    imgBorder.className = 'gene-layer layer-border';
    container.appendChild(imgBorder);

    // 4. Tipo (Sprite Sheet type.png)
    // Criamos uma DIV, não IMG, pois usamos background-position
    const divType = document.createElement('div');
    divType.className = 'gene-layer layer-type'; // Classe base que carrega a imagem

    const typeStr = (gene.geneType || '').toLowerCase();
    
    // Adiciona a classe específica para mover o sprite
    if (typeStr.includes('power')) {
        divType.classList.add('type-power');
    } else if (typeStr.includes('speed')) {
        divType.classList.add('type-speed');
    } else if (typeStr.includes('technical')) {
        divType.classList.add('type-technical');
    } else {
        // "No Type" ou Normal
        divType.classList.add('type-none');
    }

    container.appendChild(divType);

    return container;
}
// --- CRIAÇÃO DE CARDS ---

// Card de Monstro (String HTML)
function createMonsterCard(monster) {
    const combatData = monster.monster || {};
    const nomeOriginal = monster.name;
    const nomeTraduzido = MONSTER_NAME_TRANSLATIONS[nomeOriginal] || nomeOriginal;
    const rawHabitat = monster.habitat;
    const normalizedHabitatKey = HABITAT_CORRECTION_MAP[rawHabitat] || rawHabitat || '__NULL_REGION__';
    const regiao = REGION_TRANSLATIONS[normalizedHabitatKey] || normalizedHabitatKey;

    const iconFile = IMAGE_EXCEPTIONS[nomeOriginal] || `${nomeOriginal}.webp`;
    const iconPath = `assets/monster_icons/${iconFile}`;
    let ovoHTML = '';
    if (monster.hatchable) {
        const eggPath = `assets/monster_eggs/${nomeOriginal}.svg`;
        ovoHTML = `<img src="${eggPath}" class="egg-icon-only" alt="Ovo" loading="lazy" width="80" height="80" style="object-fit:contain;" onerror="this.style.display='none'">`;
    }

    const weaknessRaw = combatData.elementalWeakness;
    let weaknessKey = "None";
    if (typeof weaknessRaw === "string") weaknessKey = weaknessRaw.charAt(0).toUpperCase() + weaknessRaw.slice(1).toLowerCase();
    else if (typeof weaknessRaw === "object" && weaknessRaw !== null) weaknessKey = weaknessRaw["DEFAULT"] ? weaknessRaw["DEFAULT"].charAt(0).toUpperCase() + weaknessRaw["DEFAULT"].slice(1) : "None";
    const fraqueza = ELEMENT_TRANSLATIONS[weaknessKey] || "—";

    let attackHTML = '';
    const patterns = invertAttackPatterns(combatData.attackPatterns || {});
    const patternEntries = Object.entries(patterns);
    if(patternEntries.length > 0) {
        patternEntries.forEach(([state, type]) => {
            let stateName = ATTACK_STATE_TRANSLATIONS[state] || state;
            if(state === 'DEFAULT') stateName = 'Padrão';
            const typeLower = type ? type.toLowerCase() : 'none';
            const typeTrans = ATTACK_TRANSLATIONS[typeLower.charAt(0).toUpperCase() + typeLower.slice(1)] || "—";
            attackHTML += `<div class="info-row"><span class="info-label">${stateName}:</span><div class="attack-display"><img src="assets/icons/${typeLower}.svg" width="24" height="24" onerror="this.style.display='none'"><span>${typeTrans}</span></div></div>`;
        });
    } else {
        attackHTML = `<div class="info-row"><span class="info-label">Ataque:</span><div class="attack-display"><img src="assets/icons/none.svg" width="24" height="24"><span>—</span></div></div>`;
    }

    return `
    <div class="monster-card" onclick="this.classList.toggle('active')">
        <div class="card-image-section">
            <img src="${iconPath}" class="monster-icon-main" loading="lazy" width="80" height="80" style="object-fit:contain;" onerror="this.src='assets/monster_icons/_Unknown.webp'">
            ${ovoHTML}
        </div>
        <div class="name-header"><h2 class="monster-name">${nomeTraduzido}</h2></div>
        <p class="monster-region">Região: ${regiao}</p>
        <div class="monster-info">
            ${attackHTML}
            <div class="info-row"><span class="info-label">Fraqueza:</span><div class="weakness-display"><img src="assets/icons/${weaknessKey.toLowerCase()}.svg" width="24" height="24" onerror="this.style.display='none'"><span>${fraqueza}</span></div></div>
        </div>
        <div class="monster-details">
            <div class="parts-title">Partes & Fraquezas</div>
            ${generatePartsHTML(combatData.parts)}
        </div>
    </div>`;
}

// Card de Gene (Elemento DOM Real)
function createGeneCardElement(gene) {
    const card = document.createElement('div');
    card.className = 'gene-card';

    const nomeOriginal = gene.geneName;
    const nomeTraduzido = GENE_NAME_TRANSLATIONS[nomeOriginal] || nomeOriginal;
    const skillType = gene.isActiveSkill ? "Ativa" : "Passiva";

    // 1. Header com Ícone e Nome
    const header = document.createElement('div');
    header.className = 'gene-header';

    // Gera o ícone empilhado
    const iconContainer = createGeneIconDOM(gene);
    header.appendChild(iconContainer);

    // Info do texto
    const textInfo = document.createElement('div');
    textInfo.style.flexGrow = '1';
    textInfo.innerHTML = `
        <h3 class="gene-name" style="margin-bottom:2px;">${nomeTraduzido}</h3>
        <span class="skill-type">${skillType}</span>
    `;
    header.appendChild(textInfo);
    card.appendChild(header);

    // 2. Monstros Fixos
    if (gene.monsties && gene.monsties.fixed && gene.monsties.fixed.length > 0) {
        const fixedDiv = document.createElement('div');
        fixedDiv.className = 'monstie-list-section';
        const title = document.createElement('div');
        title.className = 'monstie-list-title';
        title.textContent = 'Garantido em:';
        fixedDiv.appendChild(title);

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'monstie-tags';
        gene.monsties.fixed.forEach(m => {
            const span = document.createElement('span');
            span.className = 'monstie-tag';
            span.style.borderColor = 'var(--accent-color)';
            span.style.fontWeight = 'bold';
            span.textContent = MONSTER_NAME_TRANSLATIONS[m] || m;
            tagsDiv.appendChild(span);
        });
        fixedDiv.appendChild(tagsDiv);
        card.appendChild(fixedDiv);
    }

    // 3. Monstros Aleatórios
    if (gene.monsties && gene.monsties.random && gene.monsties.random.length > 0) {
        const randomDiv = document.createElement('div');
        randomDiv.className = 'monstie-list-section';
        const title = document.createElement('div');
        title.className = 'monstie-list-title';
        title.textContent = 'Aleatório em:';
        randomDiv.appendChild(title);

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'monstie-tags';
        gene.monsties.random.forEach(m => {
            const span = document.createElement('span');
            span.className = 'monstie-tag';
            span.textContent = MONSTER_NAME_TRANSLATIONS[m] || m;
            tagsDiv.appendChild(span);
        });
        randomDiv.appendChild(tagsDiv);
        card.appendChild(randomDiv);
    }

    return card;
}

// --- UTILITÁRIOS ---
async function loadMonsters() {
    try { const res = await fetch('data/monsters.json'); const txt = await res.text(); return JSON.parse(txt.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*)/g, (m, g) => g ? "" : m)); } catch { return []; }
}
async function loadGenes() {
    try { const res = await fetch('data/genes.json'); return await res.json(); } catch { return []; }
}
function initFilters() {
    const rf = document.getElementById('region-filter');
    if(!rf) return;
    const habitats = new Set(allMonsters.map(m => HABITAT_CORRECTION_MAP[m.habitat] || m.habitat || '__NULL_REGION__'));
    let html = '<option value="all">Todas as Regiões</option>';
    if (typeof ORDEM_REGIOES !== 'undefined') {
        ORDEM_REGIOES.forEach(r => { if(habitats.has(r)) { html += `<option value="${r}">${REGION_TRANSLATIONS[r]||r}</option>`; habitats.delete(r); }});
    }
    habitats.forEach(r => html += `<option value="${r}">${REGION_TRANSLATIONS[r]||r}</option>`);
    rf.innerHTML = html;
}
function invertAttackPatterns(obj) {
    if (!obj) return {};
    const inv = {};
    for (const k in obj) {
        const v = obj[k].toLowerCase();
        inv[k] = v === 'technical' ? 'power' : v === 'power' ? 'speed' : v === 'speed' ? 'technical' : v;
    }
    return inv;
}
function generatePartsHTML(parts) {
    if (!parts || !Object.keys(parts).length) return '<p style="text-align:center;font-size:0.9em;color:var(--text-secondary)">—</p>';
    let html = '<div class="parts-container">';
    for (const [part, weps] of Object.entries(parts)) {
        let imgs = weps.map(w => `<img src="assets/icons/weapon-${w.toLowerCase()}.svg" class="weapon-icon-small" onerror="this.style.display='none'">`).join('');
        html += `<div class="part-row"><span class="part-name">${PART_TRANSLATIONS[part]||part}</span><div class="part-weaknesses">${imgs||'—'}</div></div>`;
    }
    return html + '</div>';
}
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', saved);
    if(btn) {
        btn.textContent = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        btn.onclick = () => {
            const novo = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', novo);
            localStorage.setItem('theme', novo);
            btn.textContent = novo === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        };
    }
}