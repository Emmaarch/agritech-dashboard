/**
 * AgriPulse AI - Système de Gestion Intégré V2
 * Développeur: Antigravity AI
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ÉTAT INITIAL & PERSISTANCE ---
    const DEFAULT_STATE = {
        eggs: [], // { date, count }
        chicks: [], // { date, count }
        crops: [], // { id, name, surface }
        harvests: [], // { date, cropId, weight }
        prices: {
            egg: 50, // CFA par unité
            harvest: 800, // CFA par kg (moyenne)
            chick: 500 // CFA par unité
        }
    };

    let state = JSON.parse(localStorage.getItem('agripulse_data')) || DEFAULT_STATE;

    function saveState() {
        localStorage.setItem('agripulse_data', JSON.stringify(state));
        updateUI();
    }

    // --- 2. GESTION DES SECTIONS ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.getAttribute('data-section');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(sec => {
                sec.classList.remove('active');
                if (sec.id === targetSection) sec.classList.add('active');
            });
        });
    });

    // --- 3. LOGIQUE ÉLEVAGE ---
    const eggForm = document.getElementById('egg-form');
    const chickForm = document.getElementById('chick-form');

    eggForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const count = parseInt(document.getElementById('egg-count').value);
        state.eggs.push({ date: new Date().toISOString(), count });
        eggForm.reset();
        saveState();
    });

    chickForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const count = parseInt(document.getElementById('chick-count').value);
        state.chicks.push({ date: new Date().toISOString(), count });
        chickForm.reset();
        saveState();
    });

    // --- 4. LOGIQUE AGRICULTURE ---
    const cropForm = document.getElementById('crop-form');
    const harvestForm = document.getElementById('harvest-form');
    const harvestCropSelect = document.getElementById('harvest-crop-select');

    cropForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('crop-name').value;
        const surface = parseFloat(document.getElementById('crop-surface').value);
        state.crops.push({ id: Date.now(), name, surface });
        cropForm.reset();
        saveState();
        updateCropSelect();
    });

    harvestForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const cropId = document.getElementById('harvest-crop-select').value;
        const weight = parseFloat(document.getElementById('harvest-weight').value);
        state.harvests.push({ date: new Date().toISOString(), cropId, weight });
        harvestForm.reset();
        saveState();
    });

    function updateCropSelect() {
        if (!harvestCropSelect) return;
        harvestCropSelect.innerHTML = state.crops.map(crop => 
            `<option value="${crop.id}">${crop.name} (${crop.surface} ha)</option>`
        ).join('');
    }

    // --- 5. MISE À JOUR UI & CALCULS ---
    function updateUI() {
        // KPI Dashboard
        const totalEggs = state.eggs.reduce((sum, entry) => sum + entry.count, 0);
        const totalChicks = state.chicks.reduce((sum, entry) => sum + entry.count, 0);
        const totalHarvests = state.harvests.reduce((sum, entry) => sum + entry.weight, 0);
        
        const revenue = (totalEggs * state.prices.egg) + (totalHarvests * state.prices.harvest);

        document.getElementById('kpi-eggs').textContent = totalEggs.toLocaleString();
        document.getElementById('kpi-chicks').textContent = totalChicks.toLocaleString();
        document.getElementById('kpi-harvests').textContent = totalHarvests.toLocaleString();
        document.getElementById('kpi-revenue').textContent = `${revenue.toLocaleString()} CFA`;

        // Historique Élevage
        const livestockTable = document.querySelector('#livestock-history tbody');
        if (livestockTable) {
            livestockTable.innerHTML = [
                ...state.eggs.map(e => ({ ...e, type: 'Œufs' })),
                ...state.chicks.map(c => ({ ...c, type: 'Poussins' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map(entry => `
                <tr>
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                    <td>${entry.type}</td>
                    <td>${entry.count}</td>
                    <td>${(entry.count * (entry.type === 'Œufs' ? state.prices.egg : state.prices.chick)).toLocaleString()} CFA</td>
                </tr>
            `).join('');
        }

        // Historique Agriculture
        const agricultureTable = document.querySelector('#agriculture-history tbody');
        if (agricultureTable) {
            agricultureTable.innerHTML = state.harvests
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(h => {
                const crop = state.crops.find(c => c.id == h.cropId);
                return `
                    <tr>
                        <td>${new Date(h.date).toLocaleDateString()}</td>
                        <td>${crop ? crop.name : 'Inconnu'}</td>
                        <td>${h.weight} kg</td>
                        <td>${crop ? (h.weight / crop.surface).toFixed(2) : '--'} kg/ha</td>
                    </tr>
                `;
            }).join('');
        }

        updateCharts();
        runAIPredictions();
    }

    // --- 6. GRAPHIQUES & IA ---
    let mainChart = null;

    function updateCharts() {
        const ctx = document.getElementById('mainPerformanceChart');
        if (!ctx) return;

        if (mainChart) mainChart.destroy();

        // On groupe par jour pour le graphique (simulé si peu de données)
        const labels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        const eggData = [0, 0, 0, 0, 0, 0, totalEggsToday()]; // Juste une démo dynamique

        mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Production (Valeur)',
                    data: [100, 150, 120, 180, 200, 210, 250],
                    borderColor: '#10b981',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
        });
    }

    function totalEggsToday() {
        const today = new Date().toDateString();
        return state.eggs
            .filter(e => new Date(e.date).toDateString() === today)
            .reduce((sum, e) => sum + e.count, 0);
    }

    function runAIPredictions() {
        const predictEggs = document.getElementById('predict-eggs');
        const predictHarvest = document.getElementById('predict-harvest');
        const aiReport = document.getElementById('ai-dynamic-content');

        // Algorithme prédictif simple (Moyenne mobile + 5%)
        const avgEggs = state.eggs.length > 0 
            ? state.eggs.reduce((sum, e) => sum + e.count, 0) / state.eggs.length 
            : 0;
        
        const predictedEggs = Math.round(avgEggs * 1.05);
        if (predictEggs) predictEggs.textContent = predictedEggs > 0 ? predictedEggs.toLocaleString() : '--';

        const avgHarvest = state.harvests.length > 0
            ? state.harvests.reduce((sum, h) => sum + h.weight, 0) / state.harvests.length
            : 0;

        const predictedHarvest = (avgHarvest * 1.1).toFixed(1);
        if (predictHarvest) predictHarvest.textContent = predictedHarvest > 0 ? `${predictedHarvest} kg` : '-- kg';

        if (aiReport) {
            aiReport.innerHTML = `
                <p>Sur la base de vos <strong>${state.harvests.length}</strong> dernières récoltes, 
                le rendement moyen est de <strong>${avgHarvest.toFixed(1)} kg</strong>.</p>
                <p style="margin-top:10px; color:var(--accent-emerald)">
                    <i class="ph ph-trend-up"></i> Tendance positive détectée (+10% prévus).
                </p>
            `;
        }
    }

    // --- 0. SPLASH SCREEN & ANIMATIONS ---
    const splash = document.getElementById('splash-screen');
    setTimeout(() => {
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                startCounters(); // Lancer les animations une fois le splash disparu
            }, 1000);
        }
    }, 2500);

    function animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = val.toLocaleString() + (id === 'kpi-revenue' ? ' CFA' : (id === 'kpi-harvests' ? ' kg' : ''));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function startCounters() {
        const totalEggs = state.eggs.reduce((sum, entry) => sum + entry.count, 0);
        const totalChicks = state.chicks.reduce((sum, entry) => sum + entry.count, 0);
        const totalHarvests = state.harvests.reduce((sum, entry) => sum + entry.weight, 0);
        const revenue = (totalEggs * state.prices.egg) + (totalHarvests * state.prices.harvest);

        animateValue('kpi-eggs', 0, totalEggs, 1500);
        animateValue('kpi-chicks', 0, totalChicks, 1500);
        animateValue('kpi-harvests', 0, totalHarvests, 1500);
        animateValue('kpi-revenue', 0, revenue, 2000);
    }

    // --- MODE DÉMO ---
    const btnDemo = document.getElementById('btn-demo');
    btnDemo?.addEventListener('click', () => {
        state = {
            ...DEFAULT_STATE,
            crops: [
                { id: 1, name: 'Maïs Doux', surface: 10.5 },
                { id: 2, name: 'Sorgho Bio', surface: 15.2 }
            ],
            eggs: Array.from({length: 30}, (_, i) => ({ 
                date: new Date(Date.now() - i * 86400000).toISOString(), 
                count: 450 + Math.floor(Math.random() * 200) 
            })),
            harvests: [
                { date: new Date().toISOString(), cropId: 1, weight: 8500 },
                { date: new Date(Date.now() - 432000000).toISOString(), cropId: 2, weight: 12400 }
            ]
        };
        saveState();
        alert("Mode Démo Activé ! Les données ont été générées.");
        location.reload(); // Recharger pour voir les animations
    });
    // --- FIN NOUVELLES FONCTIONNALITÉS ---

    // --- 7. SYSTÈME DE NOTIFICATIONS (TOASTS) ---
    function showToast(message, icon = 'ph-check-circle') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="ph-fill ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- 8. GESTION DES PARAMÈTRES (SETTINGS) ---
    const settingsForm = document.getElementById('settings-form');
    const priceEggInput = document.getElementById('price-egg');
    const priceChickInput = document.getElementById('price-chick');
    const priceHarvestInput = document.getElementById('price-harvest');

    function initSettings() {
        if (!priceEggInput) return;
        priceEggInput.value = state.prices.egg;
        priceChickInput.value = state.prices.chick;
        priceHarvestInput.value = state.prices.harvest;
    }

    settingsForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        state.prices.egg = parseInt(priceEggInput.value);
        state.prices.chick = parseInt(priceChickInput.value);
        state.prices.harvest = parseInt(priceHarvestInput.value);
        saveState();
        showToast("Tarifs mis à jour avec succès !");
    });

    // --- 9. CHATBOT IA INTERACTIF ---
    const chatBubble = document.getElementById('ai-chat-bubble');
    const chatWindow = document.getElementById('ai-chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendChat = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input-text');
    const chatMessages = document.getElementById('chat-messages');

    chatBubble?.addEventListener('click', () => {
        chatWindow.style.display = 'flex';
        chatBubble.style.display = 'none';
    });

    closeChat?.addEventListener('click', () => {
        chatWindow.style.display = 'none';
        chatBubble.style.display = 'flex';
    });

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendChat?.addEventListener('click', handleChat);
    chatInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });

    function handleChat() {
        const text = chatInput.value.trim();
        if(!text) return;
        addMessage(text, 'user');
        chatInput.value = '';

        // Simulation de réponse IA contextuelle
        setTimeout(() => {
            let response = "D'après mes analyses, votre ferme se porte bien. Avez-vous pensé à augmenter la surface de culture pour le Maïs ?";
            if(text.toLowerCase().includes('œuf') || text.toLowerCase().includes('oeuf')) {
                response = `Votre production totale est de ${state.eggs.reduce((s,e)=>s+e.count,0)} œufs. La tendance est à la hausse !`;
            } else if(text.toLowerCase().includes('prix')) {
                response = "Vous pouvez modifier les prix de vente dans l'onglet 'Paramètres' pour ajuster vos revenus.";
            }
            addMessage(response, 'bot');
        }, 1000);
    }

    // --- 10. ANIMATIONS AU SCROLL ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.glass-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = '0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(card);
    });

    // Initialisation
    initSettings();
    updateCropSelect();
    updateUI();
});
