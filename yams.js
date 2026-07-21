// ==========================================
// CONFIGURATION DES COLONNES, LIGNES & ÉTATS
// ==========================================
let configurationColonnes = [
    { id: 1, nom: "N", active: true },
    { id: 2, nom: "N↓", active: true },
    { id: 3, nom: "N↑", active: true },
    { id: 4, nom: "G", active: true },
    { id: 5, nom: "G↓", active: true },
    { id: 6, nom: "G↑", active: true },
    { id: 7, nom: "S", active: true },
    { id: 8, nom: "P", active: true },
    { id: 9, nom: "PX", active: true }
];

// Liste des lignes de jeu configurables (Indexées selon nomsLignesComplets)
let configurationLignes = [
    { id: 1, nom: "1 (As)", active: true },
    { id: 2, nom: "2", active: true },
    { id: 3, nom: "3", active: true },
    { id: 4, nom: "4", active: true },
    { id: 5, nom: "5", active: true },
    { id: 6, nom: "6", active: true },
    { id: 8, nom: "Minimum", active: true },
    { id: 9, nom: "Maximum", active: true },
    { id: 10, nom: "Brelan", active: true },
    { id: 11, nom: "Carré", active: true },
    { id: 12, nom: "Full", active: true },
    { id: 13, nom: "Petite Suite", active: true },
    { id: 14, nom: "Suite Cassée", active: true }, // Intégrée physiquement
    { id: 15, nom: "Grande Suite", active: true },
    { id: 16, nom: "Yams", active: true },
    { id: 17, nom: "Joker", active: true }
];

const nomsLignesComplets = [
    "Total Jeton",     // 0
    "1",               // 1
    "2",               // 2
    "3",               // 3
    "4",               // 4
    "5",               // 5
    "6",               // 6
    "Bonus",           // 7 (Calculé dynamiquement)
    "Minimum",         // 8
    "Maximum",         // 9
    "Brelan",          // 10
    "Carré",           // 11
    "Full",            // 12
    "Petite Suite",    // 13
    "Suite Cassée",    // 14
    "Grande Suite",    // 15
    "Yams",            // 16
    "Joker",           // 17
    "Total Cases",     // 18
    "Total Bonus",     // 19
    "Total Gérable",   // 20
    "Total Joker",     // 21
    "TOTAL FINAL"      // 22
];

// Variables de jeu globales
let DD = [1, 1, 1, 1, 1]; 
let Dg = [false, false, false, false, false]; 
let nblancer = 0;
const maxlancer = 3;
const QUOTA_MAX_GERABLE = 45;

// Matrice principale : 23 lignes (0 à 22) x 10 colonnes (0 à 9)
let tabl = Array(23).fill(0).map(() => Array(10).fill(-1));
let lancersConsommes = { 4: 0, 5: 0, 6: 0 }; 
let pariEnCours = { lig: -1, col: -1 };

// Historique des utilisations du Joker par colonne pour gérer le tarif progressif
let utilisationsJokerParColonne = Array(10).fill(0);

// ==========================================
// PARAMÈTRES ET CONFIGURATION DES RÈGLES
// ==========================================
let configRegles = {
    // Règle du bonus (ligne 7)
    bonusType: "classique", // "classique" (somme 1-6 >= 63), "somme_min_max" ou "diff_min_max"
    
    // Brelan & Carré
    brelanType: "somme_des", 
    brelanFixe: 20,
    carreType: "somme_des",  
    carreFixe: 40,
    
    // Suites & Full
    fullValeur: 30,
    petiteSuiteValeur: 30,
    suiteCasseeValeur: 20,
    grandeSuiteValeur: 40,
    
    // Yams
    yamsValeur: 50,
    doubleYamsBonus: true,

    // Configuration avancée du Joker
    jokerMode: "classique", // "aucun", "classique" (somme des dés), "libre" (valeur fixe modifiable)
    jokerValeurFixe: 15,    // Valeur de base si mode libre
    jokerLimiteUtilisation: 3, // Nombre max d'utilisations du joker par colonne
    jokerMultiplicateurProgressif: true // 1er gratuit (valeur x1), 2ème x2, 3ème x3...
};

// Chargement initial
window.onload = function() {
    genererPanneauConfiguration();
    genererGrilleHTML();
    initialiserNouvellePartie();
};

// ==========================================
// GESTION DU PANNEAU DE CONFIGURATION
// ==========================================
function basculerAffichageConfig() {
    const panel = document.getElementById("customization-panel");
    const btn = document.getElementById("btn-config");
    if (panel.style.display === "none") {
        panel.style.display = "block";
        btn.innerText = "✖ Fermer la configuration";
        btn.classList.add("active");
    } else {
        panel.style.display = "none";
        btn.innerText = "🔧 Configurer la partie";
        btn.classList.remove("active");
    }
}

function genererPanneauConfiguration() {
    const panelColonnes = document.getElementById("config-colonnes-panel");
    const panelLignes = document.getElementById("config-lignes-panel");
    
    if (panelColonnes) {
        panelColonnes.innerHTML = "<h3>Colonnes :</h3>";
        configurationColonnes.forEach((col, index) => {
            panelColonnes.innerHTML += `
                <div class="config-item" draggable="true" ondragstart="drag(event, ${index})" ondragover="allowDrop(event)" ondrop="drop(event, ${index})">
                    <span class="handle">☰</span>
                    <label>
                        <input type="checkbox" ${col.active ? 'checked' : ''} onchange="basculerColonne(${col.id}, this.checked)">
                        <strong>${col.nom}</strong>
                    </label>
                </div>
            `;
        });
    }

    if (panelLignes) {
        panelLignes.innerHTML = "<h3>Figures :</h3>";
        configurationLignes.forEach((lig) => {
            panelLignes.innerHTML += `
                <div class="config-item no-drag">
                    <label>
                        <input type="checkbox" ${lig.active ? 'checked' : ''} onchange="basculerLigne(${lig.id}, this.checked)">
                        <strong>${lig.nom}</strong>
                    </label>
                </div>
            `;
        });
    }
}

function basculerColonne(id, estActive) {
    let col = configurationColonnes.find(c => c.id === id);
    if (col) col.active = estActive;
    genererGrilleHTML();
}

function basculerLigne(id, estActive) {
    let lig = configurationLignes.find(l => l.id === id);
    if (lig) lig.active = estActive;
    genererGrilleHTML();
}

// Drag & Drop pour les colonnes
let draggedIndex = null;
function drag(ev, index) { draggedIndex = index; ev.dataTransfer.setData("text", index); }
function allowDrop(ev) { ev.preventDefault(); }
function drop(ev, targetIndex) {
    ev.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const element = configurationColonnes.splice(draggedIndex, 1)[0];
    configurationColonnes.splice(targetIndex, 0, element);
    genererPanneauConfiguration();
    genererGrilleHTML();
}

// ==========================================
// RENDU DYNAMIQUE DE LA GRILLE DE SCORES
// ==========================================
function genererGrilleHTML() {
    const table = document.getElementById("grille-scores");
    if (!table) return;
    table.innerHTML = "";
    
    let colonnesVisibles = configurationColonnes.filter(c => c.active);

    let headerRow = "<tr><th>Figures</th>";
    colonnesVisibles.forEach(col => {
        headerRow += `<th>${col.nom}</th>`;
    });
    headerRow += "</tr>";
    table.innerHTML += headerRow;

    for (let lig = 0; lig <= 22; lig++) {
        let ligneConfiguration = configurationLignes.find(l => l.id === lig);
        let estLigneTotaux = [0, 7, 18, 19, 20, 21, 22].includes(lig);
        let estVisible = estLigneTotaux || (ligneConfiguration && ligneConfiguration.active);

        if (estVisible) {
            let row = `<tr><td><strong>${nomsLignesComplets[lig]}</strong></td>`;
            colonnesVisibles.forEach(col => {
                row += `<td id="cell-${lig}-${col.id}" onclick="clicCellule(${lig}, ${col.id})">-</td>`;
            });
            row += "</tr>";
            table.innerHTML += row;
        }
    }
    mettreAJourAffichageFenetre();
}

// ==========================================
// SYSTÈME DE JEU, LANCERS DE DÉS
// ==========================================
function initialiserNouvellePartie() {
    nblancer = 0;
    Dg.fill(false);
    DD.fill(1);
    lancersConsommes = { 4: 0, 5: 0, 6: 0 };
    pariEnCours = { lig: -1, col: -1 };
    utilisationsJokerParColonne.fill(0);
    
    for (let l = 0; l <= 22; l++) {
        for (let c = 1; c <= 9; c++) tabl[l][c] = -1;
    }
    mettreAJourAffichageFenetre();
}

function basculerBloquerDe(index) {
    if (nblancer === 0) return;
    Dg[index] = !Dg[index];
    mettreAJourAffichageFenetre();
}

function lancerLesDes() {
    if (nblancer >= maxlancer) {
        alert("Maximum de 3 lancers atteint ! Enregistrez votre score.");
        return;
    }

    document.getElementById("btn-lancer").disabled = true;
    let tics = 0;

    let timerId = setInterval(() => {
        for (let i = 0; i < 5; i++) {
            if (!Dg[i]) {
                const el = document.getElementById(`de${i+1}`);
                if (el) el.className = (tics % 2 === 0) ? "de anime-a" : "de anime-b";
            }
        }
        tics++;

        if (tics >= 10) {
            clearInterval(timerId);
            for (let i = 0; i < 5; i++) {
                if (!Dg[i]) DD[i] = Math.floor(Math.random() * 6) + 1;
            }
            nblancer++;
            document.getElementById("btn-lancer").disabled = false;
            mettreAJourAffichageFenetre();
        }
    }, 60);
}

// ==========================================
// METTRE A JOUR L'AFFICHAGE ET LES VERROUS
// ==========================================
function mettreAJourAffichageFenetre() {
    for (let i = 0; i < 5; i++) {
        const el = document.getElementById(`de${i+1}`);
        if (el) {
            el.className = Dg[i] ? "de bloque" : "de";
            el.setAttribute("data-valeur", DD[i]);
            el.innerText = DD[i];
        }
    }
    document.getElementById("info-lancer").innerText = `Lancers : ${nblancer}`;

    for (let l = 0; l <= 22; l++) {
        for (let c = 1; c <= 9; c++) {
            const cell = document.getElementById(`cell-${l}-${c}`);
            if (!cell) continue;

            if (tabl[l][c] === -1) {
                cell.innerText = "-";
                if ([0, 7, 18, 19, 20, 21, 22].includes(l)) {
                    cell.className = "";
                } else {
                    cell.className = "case-libre";
                }
            } else {
                cell.innerText = tabl[l][c];
                cell.className = "";
            }
        }
    }

    // Gestion visuelle des sens de progression
    for (let l = 1; l <= 17; l++) {
        if ([0, 7].includes(l)) continue;

        // Descendant (N↓ & G↓)
        [2, 5].forEach(c => {
            const cellDesc = document.getElementById(`cell-${l}-${c}`);
            if (cellDesc && tabl[l][c] === -1) {
                let prevLig = (l === 8) ? 6 : l - 1; 
                let estAccessible = (l === 1) || (tabl[prevLig][c] !== -1);
                if (!estAccessible) {
                    cellDesc.classList.remove("case-libre");
                    cellDesc.classList.add("case-verrouillee");
                }
            }
        });

        // Montant (N↑ & G↑)
        [3, 6].forEach(c => {
            const cellMont = document.getElementById(`cell-${l}-${c}`);
            if (cellMont && tabl[l][c] === -1) {
                let nextLig = (l === 6) ? 8 : l + 1;
                let estAccessible = (l === 17) || (tabl[nextLig][c] !== -1);
                if (!estAccessible) {
                    cellMont.classList.remove("case-libre");
                    cellMont.classList.add("case-verrouillee");
                }
            }
        });

        // Colonne Sèche S (7)
        const cellSeche = document.getElementById(`cell-${l}-7`);
        if (cellSeche && tabl[l][7] === -1 && nblancer > 1) {
            cellSeche.classList.remove("case-libre");
            cellSeche.classList.add("case-verrouillee");
        }
    }

    // Affichage visuel du pari en cours
    if (pariEnCours.lig !== -1 && pariEnCours.col !== -1) {
        const cellPari = document.getElementById(`cell-${pariEnCours.lig}-${pariEnCours.col}`);
        if (cellPari) {
            cellPari.innerText = "PARI 🎯";
            cellPari.classList.remove("case-libre");
            cellPari.classList.add("case-pari");
        }
    }
}

// ==========================================
// VALIDATION ET INSCRIPTION DES POINTS
// ==========================================
function clicCellule(lig, col) {
    if (nblancer === 0) return;
    if ([0, 7, 18, 19, 20, 21, 22].includes(lig)) return; 

    // Validation des paris P et PX
    if ((col === 8 || col === 9) && tabl[lig][col] === -1) {
        if (pariEnCours.lig === -1) {
            pariEnCours.lig = lig;
            pariEnCours.col = col;
            alert(`Pari annoncé : "${nomsLignesComplets[lig]}" !`);
            mettreAJourAffichageFenetre();
            return;
        } else if (pariEnCours.lig !== lig || pariEnCours.col !== col) {
            alert(`Vous devez finir votre pari actuel.`);
            return;
        }
    }

    if (tabl[lig][col] !== -1) return;

    const cell = document.getElementById(`cell-${lig}-${col}`);
    if (cell && cell.classList.contains("case-verrouillee")) return;

    if (col === 7 && nblancer > 1) {
        alert("Sèche : Premier lancer uniquement !");
        return;
    }

    if ([4, 5, 6].includes(col)) {
        if (lancersConsommes[col] + nblancer > QUOTA_MAX_GERABLE) {
            alert("Quota lancers épuisé !");
            return;
        }
        lancersConsommes[col] += nblancer;
    }

    // Gestion spécifique du JOKER
    if (lig === 17) {
        if (configRegles.jokerMode === "aucun") {
            alert("La case Joker est désactivée par les règles actuelles !");
            return;
        }
        if (utilisationsJokerParColonne[col] >= configRegles.jokerLimiteUtilisation) {
            alert(`Limite d'utilisation du Joker atteinte pour cette colonne (${configRegles.jokerLimiteUtilisation} max).`);
            return;
        }
    }

    // Attribution des scores
    let points = calculerPoints(lig, col);

    if (col === 8 || col === 9) {
        if (pariEnCours.lig === lig && pariEnCours.col === col) {
            tabl[lig][col] = (points > 0) ? ((col === 9) ? points * 2 : points) : 0;
            pariEnCours = { lig: -1, col: -1 };
        } else {
            alert("Validez la ligne parée !");
            return;
        }
    } else {
        tabl[lig][col] = points;
    }

    // Enregistrement de l'utilisation du Joker
    if (lig === 17) {
        utilisationsJokerParColonne[col]++;
    }

    recalculerTotauxColonne(col);

    nblancer = 0;
    Dg.fill(false);
    mettreAJourAffichageFenetre();
}

// ==========================================
// CALCULATEUR DE POINTS AVEC NOUVELLES RÈGLES
// ==========================================
function calculerPoints(lig, col) {
    let comptes = Array(7).fill(0);
    DD.forEach(v => comptes[v]++);
    let sommeTotale = DD.reduce((a, b) => a + b, 0);

    if (lig >= 1 && lig <= 6) return comptes[lig] * lig;
    if (lig === 8 || lig === 9) return sommeTotale;

    // Brelan (Ligne 10)
    if (lig === 10) {
        let deBrelan = comptes.findIndex(c => c >= 3);
        if (deBrelan !== -1) {
            if (configRegles.brelanType === "somme_des") return sommeTotale;
            if (configRegles.brelanType === "somme_3") return deBrelan * 3;
            if (configRegles.brelanType === "fixe") return configRegles.brelanFixe;
        }
        return 0;
    }

    // Carré (Ligne 11)
    if (lig === 11) {
        let deCarre = comptes.findIndex(c => c >= 4);
        if (deCarre !== -1) {
            if (configRegles.carreType === "somme_des") return sommeTotale;
            if (configRegles.carreType === "somme_4") return deCarre * 4;
            if (configRegles.carreType === "fixe") return configRegles.carreFixe;
        }
        return 0;
    }

    // Full (Ligne 12)
    if (lig === 12) {
        let aBrelan = comptes.some(c => c === 3);
        let aPaire = comptes.some(c => c === 2);
        let aYams = comptes.some(c => c === 5);
        if ((aBrelan && aPaire) || aYams) return configRegles.fullValeur;
        return 0;
    }

    let chaine = comptes.slice(1).map(c => c > 0 ? "1" : "0").join("");

    // Petite Suite (Ligne 13)
    if (lig === 13) {
        return chaine.includes("1111") ? configRegles.petiteSuiteValeur : 0;
    }

    // Suite Cassée (Ligne 14) -> ex: 1-2-4-5, 1-3-4-5, 2-3-5-6, 1-2-3-5 etc.
    if (lig === 14) {
        let motifsCassee = ["11011", "10111", "11101"];
        if (motifsCassee.some(motif => chaine.includes(motif))) {
            return configRegles.suiteCasseeValeur;
        }
        return 0;
    }

    // Grande Suite (Ligne 15)
    if (lig === 15) {
        return chaine.includes("11111") ? configRegles.grandeSuiteValeur : 0;
    }

    // Yams (Ligne 16)
    if (lig === 16) {
        return comptes.some(c => c === 5) ? configRegles.yamsValeur : 0;
    }

    // JOKER AVANCÉ (Ligne 17)
    if (lig === 17) {
        let basePoints = 0;
        if (configRegles.jokerMode === "classique") {
            basePoints = sommeTotale;
        } else if (configRegles.jokerMode === "libre") {
            basePoints = configRegles.jokerValeurFixe;
        }

        // Système d'évolution des tarifs (1ère fois gratuit / normal, 2ème x2, 3ème x3...)
        if (configRegles.jokerMultiplicateurProgressif) {
            let mult = utilisationsJokerParColonne[col] + 1; // 1, 2, 3...
            return basePoints * mult;
        }
        return basePoints;
    }

    return 0;
}

// ==========================================
// CALCUL DE TOTAUX ET RÈGLES DE BONUS SPECIFIQUES
// ==========================================
function recalculerTotauxColonne(col) {
    // 1. Sous-total (lignes 1 à 6)
    let sousTotalChiffres = 0;
    let compl = true;
    for (let l = 1; l <= 6; l++) {
        if (tabl[l][col] !== -1) sousTotalChiffres += tabl[l][col]; else compl = false;
    }

    // 2. Calcul du Bonus (Ligne 7)
    let asValidés = (tabl[1][col] !== -1) ? tabl[1][col] : 0; // Quantité de 1 obtenus
    let minVal = (tabl[8][col] !== -1) ? tabl[8][col] : 0;
    let maxVal = (tabl[9][col] !== -1) ? tabl[9][col] : 0;

    if (configRegles.bonusType === "classique") {
        tabl[7][col] = (sousTotalChiffres >= 63) ? 35 : (compl ? 0 : -1);
    } 
    else if (configRegles.bonusType === "somme_min_max") {
        tabl[7][col] = (minVal + maxVal) * asValidés;
    } 
    else if (configRegles.bonusType === "diff_min_max") {
        tabl[7][col] = Math.abs(maxVal - minVal) * asValidés;
    }

    // 3. Suivi Quota Gérable (Ligne 20)
    if ([4, 5, 6].includes(col)) {
        let remplies = 0;
        for (let l = 1; l <= 17; l++) { if (l !== 7 && tabl[l][col] !== -1) remplies++; }
        if (remplies === 16) {
            let restants = QUOTA_MAX_GERABLE - lancersConsommes[col];
            tabl[20][col] = restants > 0 ? restants * 5 : 0;
        } else {
            tabl[20][col] = `(${QUOTA_MAX_GERABLE - lancersConsommes[col]} rest.)`;
        }
    }

    // 4. Total Joker Isolé (Ligne 21)
    if (tabl[17][col] !== -1) {
        tabl[21][col] = tabl[17][col];
    } else {
        tabl[21][col] = -1;
    }

    // 5. Calcul Final du score (Ligne 22)
    let total = 0;
    for (let l = 1; l <= 17; l++) { 
        if (tabl[l][col] !== -1) total += tabl[l][col]; 
    }
    if (tabl[7][col] > 0) total += tabl[7][col];
    if ([4, 5, 6].includes(col) && typeof tabl[20][col] === 'number') total += tabl[20][col];

    tabl[22][col] = total;
}

function ouvrirAide() {
    alert("Système Quota 45 :\nLes colonnes G, G↓ et G↑ disposent de 45 lancers cumulés.\nChaque lancer non-consommé rapporte +5 points à la fin.");
}