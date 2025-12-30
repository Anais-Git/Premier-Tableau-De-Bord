var all_datas_global = [];
var activite = [];
var salaireMoyen = [];
var salaireFemmes = [];
var salaireHommes = [];
var tauxTempsPlein = 0;
var tauxTempsPleinFemmes = 0;
var tauxTempsPleinHommes = 0;
var secteurSocioPro = [];
var salaireMoyenSocioPro = [];
var salaireFemmesSocioPro = [];
var salaireHommesSocioPro = [];

function run(all_datas) {
    all_datas_global = all_datas;
    stat_gender_pie(all_datas);
    serieChoix();
    salaries_by_activity(all_datas);
    salaries_bar(all_datas);
    changerJauge();
    calcul_jauge(all_datas);
    salaries_by_age(all_datas);
    salaries_by_sociopro(all_datas);
}



function stat_gender_pie(all_datas) {
    let totalHomme = 0;
    let totalFemme = 0;

    console.log("Clés disponibles :", Object.keys(all_datas[0])); // Vérifie les colonnes
    console.log("Exemple de ligne :", all_datas[0]); // Vérifie une ligne du CSV

    for (let x of all_datas) {
        let sexe = x['"SEX"'];
        let mesure = x['"DERA_MEASURE"'];
        let effectif = x['"OBS_VALUE"'];

        if (sexe && mesure && effectif) {
            sexe = sexe.replace(/"/g, '').trim();
            mesure = mesure.replace(/"/g, '').trim();
            effectif = parseFloat(effectif.replace(/"/g, '').trim());

            if (sexe === 'M' && mesure === 'EFFECTIFS_EQTP') {
                totalHomme += effectif;
            } else if (sexe === 'F' && mesure === 'EFFECTIFS_EQTP') {
                totalFemme += effectif;
            }
        }
    }

    console.log("Total Hommes :", totalHomme);
    console.log("Total Femmes :", totalFemme);

    let data = [{
        values: [totalHomme, totalFemme],
        labels: ["Hommes", "Femmes"],
        type: "pie"
    }];

    Plotly.newPlot("myplot_gender_pie", data);
}

function salaries_bar(all_datas) {
    console.log("Fonction salaries_bar exécutée");

    let salariesHomme = {};
    let salariesFemme = {};
    let countHomme = {};
    let countFemme = {};

    console.log("Clés disponibles :", Object.keys(all_datas[0])); // Vérifier les colonnes
    console.log("Exemple de ligne :", all_datas[0]); // Vérifier une ligne

    all_datas.forEach(row => {
        let salaire = parseFloat(row['"OBS_VALUE"'].replace(/"/g, '').trim()); // Convertir en float
        let deraMeasure = row['"DERA_MEASURE"'].replace(/"/g, '').trim();
        let companySize = row['"NUMBER_EMPL"'].replace(/"/g, '').trim(); // Taille entreprise = chaîne
        let sexe = row['"SEX"'].replace(/"/g, '').trim();

        if (!isNaN(salaire) && deraMeasure === 'SALAIRE_NET_EQTP_MENSUEL_MOYENNE') {
            if (!salariesHomme[companySize]) {
                salariesHomme[companySize] = 0;
                countHomme[companySize] = 0;
            }
            if (!salariesFemme[companySize]) {
                salariesFemme[companySize] = 0;
                countFemme[companySize] = 0;
            }

            if (sexe === 'M') {
                salariesHomme[companySize] += salaire;
                countHomme[companySize] += 1;
            } else if (sexe === 'F') {
                salariesFemme[companySize] += salaire;
                countFemme[companySize] += 1;
            }
        }
    });

    let companySizes = Object.keys(salariesHomme); // Garde les tailles d'entreprise sous forme de chaîne

    // Optionnel : Trie selon un ordre logique si nécessaire
    const sizeOrder = ["0-9", "10-49", "50-99", "100-249", "250-499", "500+"] // Exemple d'ordre personnalisé
    companySizes.sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

    let avgSalaryMen = companySizes.map(size => countHomme[size] > 0 ? salariesHomme[size] / countHomme[size] : 0);
    let avgSalaryWomen = companySizes.map(size => countFemme[size] > 0 ? salariesFemme[size] / countFemme[size] : 0);

    console.log("Taille entreprise:", companySizes);
    console.log("Salaires Moyens Hommes:", avgSalaryMen);
    console.log("Salaires Moyens Femmes:", avgSalaryWomen);

    let barChartData = [
        {
            x: companySizes,
            y: avgSalaryMen,
            name: "Hommes",
            type: "bar",
            marker: { color: "blue" }
        },
        {
            x: companySizes,
            y: avgSalaryWomen,
            name: "Femmes",
            type: "bar",
            marker: { color: "pink" }
        }
    ];

    let layout = {
        barmode: "group", // "group" pour comparer, "stack" pour empiler
        xaxis: { title: "Taille de l'entreprise" },
        yaxis: { title: "Salaire moyen (€)" },
        height: 400,
        width: 600
    };

    Plotly.newPlot("myplot_salary_by_size", barChartData, layout);
}

function salaries_by_activity(all_datas) {
    var legende = {
        "C10T12": "Alimentation, boissons et tabac",
        "L": "Activités immobilières",
        "B_D_E": "Industries extractives, énergie",
        "I": "Hébergement et restauration",
        "C29_30": "Matériels de transport",
        "C26T28": "Produits informatiques et électroniques",
        "H": "Transports et entreposage",
        "F": "Construction",
        "C_OTH": "Autres industries manufacturières",
        "OTQ": "Administration, santé, éducation",
        "K": "Activités financières et assurance",
        "R_S": "Arts et loisirs",
        "G": "Commerce et réparation auto",
        "J": "Information et communication",
        "M_N": "Activités spécialisées et techniques",
        "C19": "Cokéfaction et raffinage"
    };

    var salaireParActivite = {};
    var totalHomme = 0, totalFemme = 0;

    all_datas.forEach(row => {
        let activityCode = row['"ACTIVITY"'].replace(/"/g, '').trim();
        let salary = parseFloat(row['"OBS_VALUE"'].replace(/"/g, '').trim());
        let deraMeasure = row['"DERA_MEASURE"'].replace(/"/g, '').trim();
        let sexe = row['"SEX"'].replace(/"/g, '').trim();

        if (activityCode !== "_T" && !isNaN(salary) && deraMeasure === "SALAIRE_NET_EQTP_MENSUEL_MOYENNE") {
            let nomActivite = legende[activityCode];

            if (nomActivite) {
                if (!salaireParActivite[nomActivite]) {
                    salaireParActivite[nomActivite] = { salaireTotal: 0, count: 0, femmes: 0, hommes: 0 , salaireFemme:0, salaireHomme : 0 };
                }
                salaireParActivite[nomActivite].salaireTotal += salary;
                salaireParActivite[nomActivite].count++;
                if (sexe === 'F') {
                    salaireParActivite[nomActivite].femmes++;
                    salaireParActivite[nomActivite].salaireFemme+=salary;

                } else if (sexe === 'M') {
                    salaireParActivite[nomActivite].hommes++;
                    salaireParActivite[nomActivite].salaireHomme+=salary;

                }
            }
        }

    });

    console.log("Données traitées (salaireParActivite) :", salaireParActivite);

    activite.length = 0;
    salaireMoyen.length = 0;
    salaireFemmes.length = 0;
    salaireHommes.length = 0;

    for (var j in salaireParActivite) {
        activite.push(j);
        salaireMoyen.push(salaireParActivite[j].salaireTotal / salaireParActivite[j].count);
        salaireFemmes.push(salaireParActivite[j].salaireFemme / salaireParActivite[j].femmes);
        salaireHommes.push(salaireParActivite[j].salaireHomme / salaireParActivite[j].hommes);
    }
    serieChoix();
}

function serieChoix() {
    let choix = document.getElementById("dataset").value;
    let data;
    let layout;

    if (choix === "femmes") {
        data = [{
            x: activite,
            y: salaireFemmes,
            type: 'bar',
            marker: { color: 'purple' }
        }];
        layout = {
            title: "Part des femmes par secteur économique",
            xaxis: { title: "Secteur économique" },
            yaxis: { title: "Salaire moyen mensuel net des femmes" },
            height: 400,
            width: 600
        };
    } else if (choix === "hommes") {
        data = [{
            x: activite,
            y: salaireHommes,
            type: 'bar',
            marker: { color: 'blue' }
        }];
        layout = {
            title: "Part des hommes par secteur économique",
            xaxis: { title: "Secteur économique" },
            yaxis: { title: "Salaire moyen mensuel net des hommes" },
            height: 400,
            width: 600
        };
    } else {
        data = [{
            x: activite,
            y: salaireMoyen,
            type: 'bar',
            marker: { color: 'green' }
        }];
        layout = {
            title: "Différence de salaire par secteur économique",
            xaxis: { title: "Secteur économique" },
            yaxis: { title: "Salaire moyen mensuel net" },
            height: 400,
            width: 600
        };
    }

    Plotly.react("myplot_salary_by_activity", data, layout);
}

function calcul_jauge(all_datas) {
    let totalTempsComplet = 0;
    let totalEmployes = 0;
    let totalTempsCompletFemmes = 0;
    let totalEmployesFemmes = 0;
    let totalTempsCompletHommes = 0;
    let totalEmployesHommes = 0;

    all_datas.forEach(row => {
        let effectif = parseFloat(row['"OBS_VALUE"'].replace(/"/g, '').trim());
        let deraMeasure = row['"DERA_MEASURE"'].replace(/"/g, '').trim();
        let wkTime = row['"WKTIME"'].replace(/"/g, '').trim();
        let sexe = row['"SEX"'].replace(/"/g, '').trim();

        if (deraMeasure === 'EFFECTIFS_EQTP' && wkTime !== '_T') {
            totalEmployes += effectif;
            if (wkTime === 'FT') {
                totalTempsComplet += effectif;
            }
            if (sexe === 'F') {
                totalEmployesFemmes += effectif;
                if (wkTime === 'FT') {
                    totalTempsCompletFemmes += effectif;
                }
            } else if (sexe === 'M') {
                totalEmployesHommes += effectif;
                if (wkTime === 'FT') {
                    totalTempsCompletHommes += effectif;
                }
            }
        }
    });

    tauxTempsPlein = (totalTempsComplet / totalEmployes) * 100;
    tauxTempsPleinFemmes = totalEmployesFemmes ? (totalTempsCompletFemmes / totalEmployesFemmes) * 100 : 0;
    tauxTempsPleinHommes = totalEmployesHommes ? (totalTempsCompletHommes / totalEmployesHommes) * 100 : 0;

    console.log("Taux de temps complet :", tauxTempsPlein);
    console.log("Taux de temps plein Femmes :", tauxTempsPleinFemmes);
    console.log("Taux de temps plein Hommes :", tauxTempsPleinHommes);

    changerJauge();
}


function changerJauge() {
    let choix = document.getElementById("choixJauge").value;
    let tauxAfficher = 0;
    let couleurTempsPlein = "blue";
    let couleurTempsPartiel = "orange";
    let texteLegende = "Temps Plein (Bleu) / Temps Partiel (Orange)";

    if (choix === "global") {
        tauxAfficher = tauxTempsPlein;
    } else if (choix === "femmes") {
        tauxAfficher = tauxTempsPleinFemmes;
        couleurTempsPlein = "purple";
        texteLegende = "Temps Plein Femmes (Violet) / Temps Partiel (Orange)";
    } else if (choix === "hommes") {
        tauxAfficher = tauxTempsPleinHommes;
        couleurTempsPlein = "green";
        texteLegende = "Temps Plein Hommes (Vert) / Temps Partiel (Orange)";
    }

    let tauxTempsPartiel = 100 - tauxAfficher;

    let data = [
        {
            type: "indicator",
            mode: "gauge+number",
            value: tauxAfficher,
            title: { text: "Répartition Temps Plein / Temps Partiel" },
            gauge: {
                axis: { range: [0, 100] },
                bar: { color: "transparent" },
                steps: [
                    { range: [0, tauxAfficher], color: couleurTempsPlein },
                    { range: [tauxAfficher, 100], color: couleurTempsPartiel }
                ]
            }
        }
    ];

    let layout = {
        width: 500,
        height: 400,
        annotations: [
            {
                x: 0.5,
                y: -0.25,
                xref: "paper",
                yref: "paper",
                text: texteLegende,
                showarrow: false,
                font: { size: 14, color: "black" }
            }
        ]
    };

    Plotly.newPlot("myplot_jauge", data, layout);
}

function salaries_by_age(all_datas) {
    console.log("Fonction salaries_by_age exécutée");

    let salariesHomme = {};
    let salariesFemme = {};
    let countHomme = {};
    let countFemme = {};

    console.log("Clés disponibles :", Object.keys(all_datas[0])); // Vérifier les colonnes
    console.log("Exemple de ligne :", all_datas[0]); // Vérifier une ligne

    all_datas.forEach(row => {
        let salaire = parseFloat(row['"OBS_VALUE"'].replace(/"/g, '').trim()); // Convertir en float
        let deraMeasure = row['"DERA_MEASURE"'].replace(/"/g, '').trim();
        let trancheAge = row['"AGE"'].replace(/"/g, '').trim(); // Tranche d'âge en chaîne
        let sexe = row['"SEX"'].replace(/"/g, '').trim();

        // Ignorer la ligne "_T" qui correspond au total
        if (trancheAge === "_T") return;

        if (!isNaN(salaire) && deraMeasure === 'SALAIRE_NET_EQTP_MENSUEL_MOYENNE') {
            if (!salariesHomme[trancheAge]) {
                salariesHomme[trancheAge] = 0;
                countHomme[trancheAge] = 0;
            }
            if (!salariesFemme[trancheAge]) {
                salariesFemme[trancheAge] = 0;
                countFemme[trancheAge] = 0;
            }

            if (sexe === 'M') {
                salariesHomme[trancheAge] += salaire;
                countHomme[trancheAge] += 1;
            } else if (sexe === 'F') {
                salariesFemme[trancheAge] += salaire;
                countFemme[trancheAge] += 1;
            }
        }
    });

    let tranchesAges = Object.keys(salariesHomme);

    // Ordre personnalisé basé sur les codes fournis
    const ageOrder = ["Y_LT30", "Y30T39", "Y40T49", "Y50T59", "Y_GE60"];
    tranchesAges.sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));

    let avgSalaryMen = tranchesAges.map(age => countHomme[age] > 0 ? salariesHomme[age] / countHomme[age] : 0);
    let avgSalaryWomen = tranchesAges.map(age => countFemme[age] > 0 ? salariesFemme[age] / countFemme[age] : 0);

    console.log("Tranches d'âge:", tranchesAges);
    console.log("Salaires Moyens Hommes:", avgSalaryMen);
    console.log("Salaires Moyens Femmes:", avgSalaryWomen);

    let barChartData = [
        {
            x: tranchesAges,
            y: avgSalaryMen,
            name: "Hommes",
            type: "bar",
            marker: { color: "blue" }
        },
        {
            x: tranchesAges,
            y: avgSalaryWomen,
            name: "Femmes",
            type: "bar",
            marker: { color: "pink" }
        }
    ];

    let layout = {
        barmode: "group", // "group" pour comparer, "stack" pour empiler
        xaxis: {
            title: "Tranche d'âge",
            tickvals: tranchesAges,
            ticktext: ["<30", "30-39", "40-49", "50-59", "60+"], // Remplace les codes bruts par des valeurs lisibles
        },
        yaxis: { title: "Salaire moyen (€)" },
        height: 400,
        width: 600
    };

    Plotly.newPlot("myplot_salary_by_age", barChartData, layout);
}

function serieChoixSocioPro() {
    let choix = document.getElementById("salaryType").value;
    let data;
    let layout;

    if (secteurSocioPro.length === 0) {
        console.error("Aucune donnée socio-pro disponible !");
        return;
    }

    if (choix === "femmes") {
        data = [{
            x: secteurSocioPro,
            y: salaireFemmesSocioPro,
            type: 'bar',
            marker: { color: 'purple' }
        }];
        layout = {
            title: "Part des femmes par secteur socio-professionnel",
            xaxis: { title: "Secteur socio-professionnel" },
            yaxis: { title: "Salaire moyen mensuel net des femmes" },
            height: 400,
            width: 600
        };
    } else if (choix === "hommes") {
        data = [{
            x: secteurSocioPro,
            y: salaireHommesSocioPro,
            type: 'bar',
            marker: { color: 'blue' }
        }];
        layout = {
            title: "Part des hommes par secteur socio-professionnel",
            xaxis: { title: "Secteur socio-professionnel" },
            yaxis: { title: "Salaire moyen mensuel net des hommes" },
            height: 400,
            width: 600
        };
    } else {
        data = [{
            x: secteurSocioPro,
            y: salaireMoyenSocioPro,
            type: 'bar',
            marker: { color: 'green' }
        }];
        layout = {
            title: "Différence de salaire par secteur socio-professionnel",
            xaxis: { title: "Secteur socio-professionnel" },
            yaxis: { title: "Salaire moyen mensuel net" },
            height: 400,
            width: 600
        };
    }

    Plotly.react("myplot_salary_by_sociopro", data, layout);
}

function salaries_by_sociopro(all_datas) {
    var legendeSocioPro = {
        "1": "Agriculteurs exploitants",
        "2": "Artisans, commerçants et chefs d'entreprise",
        "3": "Cadres et professions intellectuelles supérieures",
        "4": "Professions intermédiaires",
        "5": "Employés",
        "6": "Ouvriers"
    };

    var salaireParSociopro = {};
    var totalHomme = 0, totalFemme = 0;

    // Traitement des données
    all_datas.forEach(row => {
        let pcsRaw = row['"PCS_ESE"'].replace(/"/g, '').trim();
        if (pcsRaw === "_T") return;
        let socioProCode = pcsRaw.charAt(0);

        let salary = parseFloat(row['"OBS_VALUE"'].replace(/"/g, '').trim());
        let deraMeasure = row['"DERA_MEASURE"'].replace(/"/g, '').trim();
        let sexe = row['"SEX"'].replace(/"/g, '').trim();

        if (socioProCode !== "_T" && !isNaN(salary) ) {
            let nomSociopro = legendeSocioPro[socioProCode];

            if (nomSociopro) {
                // Initialisation de la catégorie socio-professionnelle si elle n'existe pas
                if (!salaireParSociopro[nomSociopro]) {
                    salaireParSociopro[nomSociopro] = { salaireTotal: 0, count: 0, femmes: 0, hommes: 0, salaireFemme: 0, salaireHomme: 0 };
                }
                // Mise à jour des informations
                salaireParSociopro[nomSociopro].salaireTotal += salary;
                salaireParSociopro[nomSociopro].count++;
                if (sexe === 'F') {
                    salaireParSociopro[nomSociopro].femmes++;
                    salaireParSociopro[nomSociopro].salaireFemme += salary;
                } else if (sexe === 'M') {
                    salaireParSociopro[nomSociopro].hommes++;
                    salaireParSociopro[nomSociopro].salaireHomme += salary;
                }
            }
        }
    });

    console.log("Données traitées (salaireParSociopro) :", salaireParSociopro);
    console.log(secteurSocioPro);
    console.log(salaireMoyenSocioPro);


    // Vider les anciennes données pour les graphiques
    secteurSocioPro.length = 0;
    salaireMoyenSocioPro.length = 0;
    salaireFemmesSocioPro.length = 0;
    salaireHommesSocioPro.length = 0;

    // Remplir les données pour l'affichage graphique
    for (var j in salaireParSociopro) {
        secteurSocioPro.push(j);
        salaireMoyenSocioPro.push(salaireParSociopro[j].salaireTotal / salaireParSociopro[j].count);
        salaireFemmesSocioPro.push(salaireParSociopro[j].salaireFemme / salaireParSociopro[j].femmes);
        salaireHommesSocioPro.push(salaireParSociopro[j].salaireHomme / salaireParSociopro[j].hommes);
    }
    serieChoixSocioPro();
}

