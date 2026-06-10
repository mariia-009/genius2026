const map = document.getElementById("map");
const infoPanel = document.getElementById("infoPanel");

let chart;
let yearChart;
let budgetChart;
let chartsInitialized = false;
let mapDesignConfig = {};

/* ===============================*/

const buildingTypes = {
    apartment: {
        name: "Квартири",
        icon: "🏢",
        class: "apartment",
        consumption: 250
    },
    house: {
        name: "Приватні будинки",
        icon: "🏠",
        class: "house",
        consumption: 400
    },
    public: {
        name: "Громадські будівлі",
        icon: "🏫",
        class: "public",
        consumption: 3000
    }
};


function applyMapDesign() {
    const rows = document.querySelectorAll("#mapDesignTable tbody tr");
    let designData = {};
    let counts = [];
    let newTotalBase = 0; 

    rows.forEach(row => {
        const category = row.dataset.category;
        const show = row.querySelector(".mapShowCheck").checked;
        const color = row.querySelector(".mapColor").value;
        const count = parseInt(row.querySelector(".mapCount").value) || 0;
        const consumptionPerUnit = parseFloat(row.querySelector(".mapConsumption").value) || 0;

        designData[category] = { show, color, count };

        if (buildingTypes[category]) {
            buildingTypes[category].consumption = consumptionPerUnit;
        }
        newTotalBase += count * consumptionPerUnit;

        if (show && count > 0) {
            counts.push(count);
        }
    });

    baseConsumption = newTotalBase;
    if (counts.length === 0) return;

    const gcdValue = gcdArray(counts);
    mapDesignConfig.designData = designData;
    generateScaleOptions(gcdValue);

    const select = document.getElementById("mapScaleSelect");
    mapDesignConfig.scale = parseInt(select.value) || gcdValue;

    renderMap();
    updateChart({
        apartment: designData.apartment.count,
        house: designData.house.count,
        public: designData.public.count
    });
    realtimePreview();
}

function renderMap() {
    map.innerHTML = "";
    const config = mapDesignConfig;

    if (!config.designData) return;
    const radius = 6;
    for (let category in config.designData) {
        const d = config.designData[category];
        if (!d.show || d.count <= 0) continue;
        let groups = Math.floor(d.count / config.scale);
        const type = buildingTypes[category];
        for (let i = 0; i < groups; i++) {
            const building = document.createElement("div");
            building.classList.add("building");
            building.style.background = d.color;
            building.style.width = radius + "px";
            building.style.height = radius + "px";
            building.style.borderRadius = "50%";
            building.style.left = Math.random() * 95 + "%";
            building.style.top = Math.random() * 90 + "%";
            map.appendChild(building);
        }
    }
}

function updateChart(config) {
    const labels = [
        buildingTypes.apartment.name,
        buildingTypes.house.name,
        buildingTypes.public.name
    ];
    const data = [
        config.apartment,
        config.house,
        config.public
    ];

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("buildingChart"), {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data
            }]
        }
    });
}

/* ===============================*/

let baseConsumption = 12900000;

let measures = {
    led: { cost: 15, effect: 0.08 },
    insulation: { cost: 25, effect: 0.15 },
    solar: { cost: 30, effect: 0.20 },
    smart: { cost: 10, effect: 0.05 },
    home: { cost: 6, effect: 0.03 }
};

function addMeasure() {
    const name = document.getElementById("newMeasureName").value;
    const cost = parseFloat(document.getElementById("newMeasureCost").value);
    let effect = parseFloat(document.getElementById("newMeasureEffect").value);

    if (isNaN(effect)) return;
    effect = effect / 100;
    if (!name || isNaN(cost) || isNaN(effect)) return;
    const key = name.toLowerCase().replace(/\s+/g, "_");
    measures[key] = { cost, effect };
    refreshMeasureUI();
}

function renderMeasureConfigTable() {
    const tbody = document.querySelector("#measureConfigTable tbody");
    tbody.innerHTML = "";
    for (let key in measures) {
        const m = measures[key];
        tbody.innerHTML += `
            <tr data-key="${key}">
                <td><input type="text" class="edit-name" value="${key}" onchange="updateMeasureData('${key}', 'name', this.value)"></td>
                <td><input type="number" class="edit-cost" value="${m.cost}" onchange="updateMeasureData('${key}', 'cost', this.value)"></td>
                <td><input type="number" class="edit-effect" value="${(m.effect * 100).toFixed(1)}" onchange="updateMeasureData('${key}', 'effect', this.value)"> %</td>
                <td>
                    <button onclick="deleteMeasure('${key}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Видалити</button>
                </td>
            </tr>
        `;
    }
}

function updateMeasureData(oldKey, field, value) {
    if (field === 'name') {
        const newKey = value.toLowerCase().replace(/\s+/g, "_");
        if (newKey !== oldKey && newKey !== "") {
            measures[newKey] = measures[oldKey];
            delete measures[oldKey];
            refreshMeasureUI();
        }
    } else if (field === 'cost') {
        measures[oldKey].cost = parseFloat(value) || 0;
    } else if (field === 'effect') {
        measures[oldKey].effect = (parseFloat(value) || 0) / 100;
    }
    realtimePreview();
}

function updateMeasureSelectors() {

    const selects = document.querySelectorAll(".measureSelect");
    selects.forEach(select => {
        const current = select.value;
        select.innerHTML = "";
        for (let key in measures) {
            select.innerHTML += `
                <option value="${key}">
                    ${key}
                </option>
            `;
        }
        if (measures[current]) {
            select.value = current;
        }
    });
}

function deleteMeasure(key) {
    delete measures[key];
    renderMeasureConfigTable();
    updateMeasureSelectors();
}

function refreshAllMeasureBlocks() {

    document.querySelectorAll(".measureSelect").forEach(select => {
        const currentValue = select.value;
        select.innerHTML = "";
        for (let key in measures) {
            select.innerHTML += `
                <option value="${key}">
                    ${key}
                </option>
            `;
        }
        if (measures[currentValue]) {
            select.value = currentValue;
        }
    });
}


function refreshMeasureUI() {
    renderMeasureConfigTable();
    refreshAllMeasureBlocks();
    document.querySelectorAll(".measureSelect").forEach(select => {
        const current = select.value;
        select.innerHTML = "";
        for (let key in measures) {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key;
            select.appendChild(option);
        }
        if (measures[current]) {
            select.value = current;
        }
    });
}
/* ------------------------------------- */

function generatePlanTable() {

    const tbody = document.querySelector("#planTable tbody");
    tbody.innerHTML = "";

    for (let year = 1; year <= 10; year++) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${year}</td>
            <td><input type="number" min="0" value="0"></td>
            <td><input type="number" min="0" value="0"></td>
            <td><input type="number" min="0" value="0"></td>
            <td><input type="number" min="0" value="0"></td>
            <td><input type="number" min="0" value="0"></td>
        `;
        tbody.appendChild(row);
    }
    attachRealtimeListeners();
}

/* -------------------------------------------- */

function attachRealtimeListeners() {
    document.querySelectorAll("#planTable input")
        .forEach(input => {
            input.addEventListener("input", realtimePreview);
        });
    realtimePreview();
}

function realtimePreview() {
    initCharts();
    let previewData = [];
    let costData = [];
    let budgetHistory = [];
    let tableHTML = "";

    let totalSaved = 0;
    let totalSpent = 0;
    let totalEfficiency = 0; 
    let totalConsumption = 0; 
    let totalLeftover = 0; 

    const yearBlocks = document.querySelectorAll(".yearBlock");
    const isCumulative = document.querySelector('input[name="calcMode"][value="cumulative"]').checked;

    let budget = 100;
    let globalEfficiencyMultiplier = 1;
    let currentBase = baseConsumption;

    yearBlocks.forEach((block, yearIndex) => {
        const addApt = parseInt(block.querySelector(".growth-apartment")?.value) || 0;
        const addHouse = parseInt(block.querySelector(".growth-house")?.value) || 0;
        const addPub = parseInt(block.querySelector(".growth-public")?.value) || 0;

        currentBase += (addApt * buildingTypes.apartment.consumption) +
                       (addHouse * buildingTypes.house.consumption) +
                       (addPub * buildingTypes.public.consumption);

        let yearCost = 0;
        let currentYearMultiplier = isCumulative ? globalEfficiencyMultiplier : 1;

        const measureRows = block.querySelectorAll(".measureRow");
        measureRows.forEach(row => {
            const measureType = row.querySelector(".measureSelect").value;
            const count = parseInt(row.querySelector(".measureCount").value) || 0;
            const measureConfig = measures[measureType];

            if (!measureConfig || count <= 0) return;

            let selectedCategories = Array.from(
                row.querySelectorAll(".categoryCheck:checked")
            ).map(cb => cb.value);

            if (selectedCategories.length === 0) return;

            let k = selectedCategories.length;
            yearCost += measureConfig.cost * k * count;

            for (let i = 0; i < (count * k); i++) {
                currentYearMultiplier *= (1 - measureConfig.effect);
            }
        });

        if (isCumulative) {
            globalEfficiencyMultiplier = currentYearMultiplier;
        }

        let leftover = budget - yearCost;
        let consumption = currentBase * currentYearMultiplier;
        let yearlySaved = currentBase - consumption; 

        if (yearCost > budget + 0.01) { 
            block.style.background = "#ffdddd";
            block.style.border = "2px solid #ff4d4d";
        } else {
            block.style.background = "white";
            block.style.border = "1px solid #ddd";
        }

        totalSaved += yearlySaved;
        totalSpent += yearCost;
        totalEfficiency += (1 - currentYearMultiplier) * 100;
        totalConsumption += consumption;
        totalLeftover += leftover;

        previewData.push(consumption);
        costData.push(yearCost);
        budgetHistory.push(budget);

        tableHTML += `
            <tr style="${yearCost > budget + 0.01 ? 'background: #ffdddd;' : ''}">
                <td>${yearIndex + 1}</td>
                <td>${budget.toFixed(1)}</td>
                <td>${yearCost.toFixed(1)}</td>
                <td>${((1 - currentYearMultiplier) * 100).toFixed(1)}%</td>
                <td>${Math.round(consumption).toLocaleString()}</td>
                <td style="color: #28a745; font-weight: bold;">+${Math.round(yearlySaved).toLocaleString()}</td>
                <td>${leftover.toFixed(1)}</td>
            </tr>
        `;

        budget = 100 + leftover;
    });

    document.querySelector("#resultTable tbody").innerHTML = tableHTML;
    renderFooter(totalSpent, totalEfficiency, totalConsumption, totalSaved, totalLeftover, yearBlocks.length);
    updateCharts(previewData, budgetHistory, costData);

    showStrategyDescription(window.lastStrategyType || 'manual', {
        totalSaved, totalSpent, avgEfficiency: totalEfficiency / (yearBlocks.length || 1)
    });
}


function renderFooter(totalSpent, totalEfficiency, totalConsumption, totalSaved, totalLeftover, years) {
    const tfoot = document.querySelector("#resultTableFoot");
    if (!tfoot) return;
    tfoot.innerHTML = `
        <tr style="background: #e9ecef; font-weight: bold; border-top: 2px solid #dee2e6;">
            <td colspan="2">РАЗОМ / СЕРЕДНЄ:</td>
            <td>Σ ${totalSpent.toFixed(1)}</td>
            <td>avg ${(totalEfficiency / years).toFixed(1)}%</td>
            <td>avg ${Math.round(totalConsumption / years).toLocaleString()}</td>
            <td style="color: #28a745; font-size: 1.1em;">Σ ${Math.round(totalSaved).toLocaleString()}</td>
            <td>avg ${(totalLeftover / years).toFixed(1)}</td>
        </tr>
    `;
}

function updateCharts(previewData, budgetHistory, costData) {
    yearChart.data.labels = previewData.map((_, i) => "Рік " + (i + 1));
    yearChart.data.datasets[0].data = previewData;
    yearChart.update();

    budgetChart.data.labels = previewData.map((_, i) => "Рік " + (i + 1));
    budgetChart.data.datasets[0].data = budgetHistory; 
    budgetChart.data.datasets[1].data = costData;      
    budgetChart.update();
}


/* ===============================*/

function initCharts() {

    if (chartsInitialized) return;

    const labels = Array.from({ length: 10 }, (_, i) => "Рік " + (i + 1));

    yearChart = new Chart(document.getElementById("yearChart"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Споживання енергії",
                data: Array(10).fill(baseConsumption)
            }]
        }
    });

    budgetChart = new Chart(document.getElementById("budgetChart"), {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Початковий бюджет",
                    data: Array(10).fill(100)
                },
                {
                    label: "Витрати",
                    data: Array(10).fill(0)
                }
            ]
        }
    });

    chartsInitialized = true;
}


function generatePlanBlocks() {
    const container = document.getElementById("planContainer");
    const yearTemplate = document.getElementById("yearBlockTemplate");
    const measureTemplate = document.getElementById("measureRowTemplate");

    container.innerHTML = "";

    for (let year = 1; year <= 10; year++) {

        const block = yearTemplate.content.cloneNode(true);

        block.querySelector(".yearNumber").textContent = year;

        const measuresList = block.querySelector(".measuresList");

        block.querySelector(".addMeasureBtn")
            .addEventListener("click", () => {
                const measureRow = measureTemplate.content.cloneNode(true);
                measuresList.appendChild(measureRow);
            });
        container.appendChild(block);
    }
    attachPlanRealtimeListeners();
}


function attachPlanRealtimeListeners() {
    document.getElementById("planContainer").addEventListener("input", e => {
        if (e.target.tagName === "INPUT" || e.target.closest(".measureRow")) {
            realtimePreview();
        }
    });

    document.getElementById("planContainer").addEventListener("change", e => {
        if (e.target.tagName === "SELECT" || e.target.closest(".measureRow")) {
            realtimePreview();
        }
    });
}

function gcd(a, b) {
    while (b !== 0) {
        let t = b;
        b = a % b;
        a = t;
    }
    return Math.abs(a);
}

function gcdArray(arr) {
    if (arr.length === 0) return 1;
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = gcd(result, arr[i]);
    }
    return result || 1;
}

function generateScaleOptions(g) {
    const select = document.getElementById("mapScaleSelect");
    select.innerHTML = "";
    if (!g || g <= 0) return;
    const divisors = [];
    for (let i = 1; i <= g; i++) {
        if (g % i === 0) divisors.push(i);
    }
    divisors.sort((a, b) => a - b);
    divisors.forEach(d => {
        const option = document.createElement("option");
        option.value = d;
        option.textContent = "1 : " + d ;
        select.appendChild(option);

    });
    select.value = divisors[divisors.length - 1];
}

function applyOptimalStrategy() {
    window.lastStrategyType = 'optimal';
    document.querySelectorAll(".yearBlock .measuresList").forEach(list => list.innerHTML = "");
    const sortedMeasures = Object.entries(measures)
        .map(([key, data]) => ({ key, ...data, roi: data.effect / data.cost }))
        .sort((a, b) => b.roi - a.roi);
    let currentBalance = 100; 

    for (let year = 1; year <= 10; year++) {
        let spentThisYear = 0;
        const block = document.querySelectorAll(".yearBlock")[year - 1];
        const measuresList = block.querySelector(".measuresList");
        let limit = currentBalance - 0.01;

        for (let measure of sortedMeasures) {
            if (measure.cost <= 0) continue;
            let fullCost = measure.cost * 3;
            while (spentThisYear + fullCost <= limit) {
                spentThisYear += fullCost;
                addMeasureToUI(measuresList, measure.key, ["apartment", "house", "public"]);
            }

            const cats = ["apartment", "house", "public"];
            for (let cat of cats) {
                if (spentThisYear + measure.cost <= limit) {
                    spentThisYear += measure.cost;
                    addMeasureToUI(measuresList, measure.key, [cat]);
                }
            }
        }
        currentBalance = 100 + (currentBalance - spentThisYear);
    }
    realtimePreview();
    showStrategyDescription('optimal');
}

function addMeasureToUI(container, measureKey, categories) {
    const existingRows = container.querySelectorAll(".measureRow");
    let found = false;

    existingRows.forEach(row => {
        const sel = row.querySelector(".measureSelect").value;
        const checkedCats = Array.from(row.querySelectorAll(".categoryCheck:checked")).map(cb => cb.value);
    
        const sameMeasure = (sel === measureKey);
        const sameCategories = (checkedCats.length === categories.length && 
                               checkedCats.every(c => categories.includes(c)));

        if (sameMeasure && sameCategories) {
            const input = row.querySelector(".measureCount");
            input.value = parseInt(input.value) + 1; 
            found = true;
        }
    });

    if (!found) {
        const template = document.getElementById("measureRowTemplate");
        const row = template.content.cloneNode(true);
        row.querySelector(".measureSelect").value = measureKey;
        row.querySelector(".measureCount").value = 1;
        row.querySelectorAll(".categoryCheck").forEach(cb => {
            cb.checked = categories.includes(cb.value);
        });

        container.appendChild(row);
    }
}

function renderBenchmarkButtons() {
    const container = document.getElementById("benchmarkButtons");
    container.innerHTML = "";

    for (let key in measures) {
        const btn = document.createElement("button");
        btn.textContent = `Тільки ${key.toUpperCase()}`;
        btn.style.margin = "5px";
        btn.className = "btn-info";
        btn.onclick = () => investOnlyIn(key);
        container.appendChild(btn);
    }
}

function investOnlyIn(key) {
    clearOnlyMeasures();
    window.lastStrategyType = key; 
    const measureConfig = measures[key];
    if (!measureConfig) return;

    const yearBlocks = document.querySelectorAll(".yearBlock");
    let runningBudget = 100; 

    yearBlocks.forEach((block) => {
        let alreadySpent = 0;
        block.querySelectorAll(".measureRow").forEach(row => {
            const mType = row.querySelector(".measureSelect").value;
            const mCount = parseInt(row.querySelector(".measureCount").value) || 0;
            const mCats = row.querySelectorAll(".categoryCheck:checked").length;
            if (measures[mType]) alreadySpent += measures[mType].cost * mCount * mCats;
        });

        let availableNow = runningBudget - alreadySpent;
        const categoriesCount = 3;
        const unitCost = measureConfig.cost * categoriesCount;
        let canAfford = Math.floor(availableNow / unitCost);
        
        if (canAfford > 0) {
            const list = block.querySelector(".measuresList");
            const template = document.getElementById("measureRowTemplate");
            const row = template.content.cloneNode(true).querySelector(".measureRow");
            
            row.querySelector(".measureSelect").value = key;
            row.querySelector(".measureCount").value = canAfford;
            
            list.appendChild(row);
            availableNow -= (canAfford * unitCost);
        }
        runningBudget = 100 + availableNow;
    });

    realtimePreview(); 
}


function clearOnlyMeasures() {
    const measureLists = document.querySelectorAll(".measuresList");
    measureLists.forEach(list => {
        list.innerHTML = ""; 
    });
}

function clearAllPlans() {
    document.querySelectorAll(".yearBlock .measuresList").forEach(list => {
            list.innerHTML = "";
        });
    realtimePreview();
}


let savedStrategies = {}; 
function saveCurrentStrategy() {
    const name = document.getElementById("strategyName").value.trim();
    if (!name) {
        alert("Будь ласка, введіть назву для стратегії!");
        return;
    }

    const yearBlocks = document.querySelectorAll(".yearBlock");
    let strategyData = [];

    yearBlocks.forEach(block => {
        let yearMeasures = [];
        const measureRows = block.querySelectorAll(".measureRow");
        
        measureRows.forEach(row => {
            yearMeasures.push({
                type: row.querySelector(".measureSelect").value,
                count: row.querySelector(".measureCount").value,
                cats: Array.from(row.querySelectorAll(".categoryCheck:checked")).map(cb => cb.value)
            });
        });
        strategyData.push(yearMeasures);
    });

    savedStrategies[name] = strategyData;
    updateSavedListUI();
    document.getElementById("strategyName").value = ""; 
}

function updateSavedListUI() {
    const container = document.getElementById("savedStrategiesList");
    container.innerHTML = "";

    for (let name in savedStrategies) {
        const btnGroup = document.createElement("div");
        btnGroup.innerHTML = `
            <button onclick="loadStrategy('${name}')" style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                📁 ${name}
            </button>
            <button onclick="deleteSavedStrategy('${name}')" style="background: #ff4d4d; color: white; border: none; padding: 8px 10px; border-radius: 5px; cursor: pointer; margin-left: -5px;">
                ✖
            </button>
        `;
        container.appendChild(btnGroup);
    }
}

function loadStrategy(name) {
    const data = savedStrategies[name];
    if (!data) return;

    document.querySelectorAll(".yearBlock .measuresList").forEach(list => list.innerHTML = "");

    data.forEach((yearMeasures, index) => {
        const block = document.querySelectorAll(".yearBlock")[index];
        const container = block.querySelector(".measuresList");

        yearMeasures.forEach(m => {
            addMeasureToUI(container, m.type, m.cats);
            container.lastElementChild.querySelector(".measureCount").value = m.count;
        });
    });
    realtimePreview();
}

function deleteSavedStrategy(name) {
    if (confirm(`Видалити стратегію "${name}"?`)) {
        delete savedStrategies[name];
        updateSavedListUI();
    }
}

function investEqually() {
    clearOnlyMeasures(); 
    window.lastStrategyType = 'equal';
    
    let runningBudget = 100;
    const allKeys = Object.keys(measures); 
    const categories = ["apartment", "house", "public"]; 
    const yearBlocks = document.querySelectorAll(".yearBlock");

    yearBlocks.forEach(block => {
        const list = block.querySelector(".measuresList");
        let spentThisYear = 0;

        let possibleActions = [];
        allKeys.forEach(key => {
            categories.forEach(cat => {
                possibleActions.push({ key: key, category: cat, cost: measures[key].cost });
            });
        });

        let budgetPerAction = runningBudget / possibleActions.length;

        possibleActions.forEach(action => {
            let count = Math.floor(budgetPerAction / action.cost);
            
            if (count > 0) {
                const template = document.getElementById("measureRowTemplate");
                const row = template.content.cloneNode(true).querySelector(".measureRow");
            
                row.querySelector(".measureSelect").value = action.key;
                row.querySelector(".measureCount").value = count;
                
                row.querySelectorAll(".categoryCheck").forEach(cb => {
                    cb.checked = (cb.value === action.category);
                });

                list.appendChild(row);
                spentThisYear += (count * action.cost);
            }
        });

        runningBudget = (runningBudget - spentThisYear) + 100;
    });

    realtimePreview(); 
}


function showStrategyDescription(type, currentData) {
    const descBlock = document.getElementById("strategyDescription");
    const title = document.getElementById("descTitle");
    const text = document.getElementById("descText");

    const moneySaved = Math.round(currentData.totalSaved * 4.5);
    const costPerPercent = currentData.totalSpent / (currentData.avgEfficiency || 1);

    const texts = {
        optimal: {
            title: "Максимальна оптимізація",
            text: `Алгоритм автоматично обрав заходи з найвищим коефіцієнтом енергетичної віддачі. Це дозволило досягти середньої ефективності <b>${currentData.avgEfficiency.toFixed(1)}%</b>. Кожна одиниця бюджету тут працює на 100% потужності.`
        },
        equal: {
            title: "Рівномірний розподіл",
            text: `Рівномірний розподіл коштів між усіма технологіями. Це знижує ризики залежності від одного постачальника, проте питома вартість 1% економії складає <b>${costPerPercent.toFixed(2)}</b> бюджетних одиниць, що вище за оптимальний показник.`
        },
        led: {
            title: "Низьковитратна модернізація (LED)",
            text: "Фокус на швидких інвестиціях. Це дозволяє миттєво вивільнити ліквідність бюджету за рахунок низької вартості впровадження, але має обмежений потенціал для масштабного зниження споживання міста."
        },
        solar: {
            title: "Сонячна генерація ",
            text: `Високотехнологічна стратегія. Попри високий поріг входу, ви капіталізуєте бюджет у власну генерацію, що забезпечує сталий розвиток у довгостроковій перспективі (15+ років).`
        }
    };

    const info = texts[type] || { 
        title: `Спеціалізований сценарій: ${type.toUpperCase()}`, 
        text: "Аналітичний сценарій, що базується на пріоритетному впровадженні обраної технології в усіх секторах муніципалітету." 
    };

    // Солідний блок з цифрами
    const statsHTML = `
        <div style="margin-top: 15px; border-top: 2px solid #007bff; padding-top: 10px; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold; color: #007bff;">Аналітика стратегії:</p>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.95em;">
                <li>Сумарна економія за 10 років: <b>${Math.round(currentData.totalSaved).toLocaleString()} кВт·год</b></li>
                <li>Прогнозований економічний ефект: <b>~${moneySaved.toLocaleString()} грн</b></li>
                <li>Ефективність використання бюджету: <b>${(currentData.totalSaved / currentData.totalSpent).toFixed(2)} кВт/грн</b></li>
            </ul>
        </div>
    `;

    title.innerText = info.title;
    text.innerHTML = info.text + statsHTML;
    descBlock.style.display = "block";
}
/* ===  === */

function initApp() {
    document.getElementById("mapScaleSelect").addEventListener("change", () => {
        mapDesignConfig.scale = parseInt(document.getElementById("mapScaleSelect").value);
        renderMap();
    });
    document.getElementById("optimizeBtn").addEventListener("click", applyOptimalStrategy);

    generatePlanBlocks();
    renderMeasureConfigTable();
    updateMeasureSelectors();
    initCharts();
    renderBenchmarkButtons();

    applyMapDesign(); 

    attachPlanRealtimeListeners();
    realtimePreview();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

function scrollToDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    dashboard.scrollIntoView({ behavior: 'smooth' });
  }
}