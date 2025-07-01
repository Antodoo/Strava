document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const activityForm = document.getElementById('activity-form');
    const dashboardView = document.getElementById('dashboard-view');
    const activitiesView = document.getElementById('activities-view');
    const activityDetailView = document.getElementById('activity-detail-view');
    const addActivityView = document.getElementById('add-activity-view');
    const recentActivitiesList = document.getElementById('recent-activities-list');
    const filteredActivitiesList = document.getElementById('filtered-activities-list');
    const activityDetailContent = document.getElementById('activity-detail-content');
    const activitiesTitle = document.getElementById('activities-title');
    const sortActivities = document.getElementById('sort-activities');
    const totalActivitiesElement = document.getElementById('total-activities');
    const totalDistanceElement = document.getElementById('total-distance');
    const segmentsSection = document.getElementById('segments-section');
    const segmentsContainer = document.getElementById('segments-container');
    const addSegmentBtn = document.getElementById('add-segment');
    const segmentTemplate = document.getElementById('segment-template');
    
    // Navigation et boutons
    const navLinks = document.querySelectorAll('nav ul li a');
    const sessionTypeLinks = document.querySelectorAll('.session-type');
    const addSessionBtn = document.getElementById('add-session-btn');
    const backToActivitiesBtn = document.getElementById('back-to-activities');
    const cancelAddActivityBtn = document.getElementById('cancel-add-activity');
    const editActivityBtn = document.getElementById('edit-activity');
    const deleteActivityBtn = document.getElementById('delete-activity');
    
    // Variables d'état
    let activities = JSON.parse(localStorage.getItem('runActivities')) || [];
    let currentActivityId = null;
    let currentFilter = 'all';
    let currentView = 'dashboard';
    let editMode = false;
    
    // Initialisation
    init();
    
    function init() {
        // Afficher les activités
        updateStats();
        renderRecentActivities();
        renderFilteredActivities();
        
        // Ajouter les écouteurs d'événements
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Navigation principale
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.getAttribute('data-view');
                switchView(view);
            });
        });
        
        // Filtrage par type de séance
        sessionTypeLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                sessionTypeLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                currentFilter = this.getAttribute('data-type');
                activitiesTitle.textContent = getFilterTitle(currentFilter);
                renderFilteredActivities();
                switchView('activities');
            });
        });
        
        // Bouton d'ajout de séance
        addSessionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            editMode = false;
            document.getElementById('form-title').textContent = 'Ajouter une séance';
            activityForm.reset();
            document.getElementById('activity-id').value = '';
            // Vider les segments existants
            segmentsContainer.innerHTML = '';
            // Ajouter un segment vide par défaut
            addSegment();
            switchView('add-activity');
        });
        
        // Retour à la liste des activités
        backToActivitiesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchView('activities');
        });
        
        // Annuler l'ajout d'activité
        cancelAddActivityBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchView(currentView === 'dashboard' ? 'dashboard' : 'activities');
        });
        
        // Modifier une activité
        editActivityBtn.addEventListener('click', function() {
            if (currentActivityId) {
                const activity = activities.find(a => a.id === currentActivityId);
                if (activity) {
                    fillFormWithActivity(activity);
                    editMode = true;
                    document.getElementById('form-title').textContent = 'Modifier la séance';
                    switchView('add-activity');
                }
            }
        });
        
        // Supprimer une activité
        deleteActivityBtn.addEventListener('click', function() {
            if (currentActivityId && confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
                activities = activities.filter(a => a.id !== currentActivityId);
                saveActivities();
                updateStats();
                renderRecentActivities();
                renderFilteredActivities();
                switchView('activities');
            }
        });
        
        // Tri des activités
        sortActivities.addEventListener('change', function() {
            renderFilteredActivities();
        });
        
        // Ajouter un segment
        addSegmentBtn.addEventListener('click', function() {
            addSegment();
        });
        
        // Soumission du formulaire
        activityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveActivity();
        });
    }
    
    // Fonctions de navigation
    function switchView(view) {
        // Cacher toutes les vues
        dashboardView.classList.remove('active-view');
        activitiesView.classList.remove('active-view');
        activityDetailView.classList.remove('active-view');
        addActivityView.classList.remove('active-view');
        
        // Afficher la vue demandée
        switch(view) {
            case 'dashboard':
                dashboardView.classList.add('active-view');
                break;
            case 'activities':
                activitiesView.classList.add('active-view');
                break;
            case 'activity-detail':
                activityDetailView.classList.add('active-view');
                break;
            case 'add-activity':
                addActivityView.classList.add('active-view');
                break;
        }
        
        // Mettre à jour la navigation
        navLinks.forEach(link => {
            if (link.getAttribute('data-view') === view) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Sauvegarder la vue actuelle
        if (view !== 'activity-detail' && view !== 'add-activity') {
            currentView = view;
        }
    }
    
    function getFilterTitle(filter) {
        switch(filter) {
            case 'fractionne': return 'Séances de fractionné';
            case 'endurance': return 'Séances d\'endurance';
            case 'trail': return 'Séances de trail';
            default: return 'Toutes les séances';
        }
    }
    
    // Fonctions de rendu
    function renderRecentActivities() {
        recentActivitiesList.innerHTML = '';
        
        const recentActivitiesToShow = activities.slice(0, 4);
        
        if (recentActivitiesToShow.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune activité enregistrée pour le moment.';
            emptyMessage.style.gridColumn = '1 / -1';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--text-light)';
            emptyMessage.style.padding = '20px';
            recentActivitiesList.appendChild(emptyMessage);
            return;
        }
        
        recentActivitiesToShow.forEach(activity => {
            const activityCard = createActivityCard(activity);
            recentActivitiesList.appendChild(activityCard);
        });
    }
    
    function renderFilteredActivities() {
        filteredActivitiesList.innerHTML = '';
        
        // Filtrer les activités
        let filteredActivities = activities;
        if (currentFilter !== 'all') {
            filteredActivities = activities.filter(activity => activity.type === currentFilter);
        }
        
        // Trier les activités
        const sortValue = sortActivities.value;
        filteredActivities = sortActivitiesList(filteredActivities, sortValue);
        
        if (filteredActivities.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune activité trouvée pour ce type de séance.';
            emptyMessage.style.gridColumn = '1 / -1';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--text-light)';
            emptyMessage.style.padding = '20px';
            filteredActivitiesList.appendChild(emptyMessage);
            return;
        }
        
        filteredActivities.forEach(activity => {
            const activityCard = createActivityCard(activity);
            filteredActivitiesList.appendChild(activityCard);
        });
    }
    
    function renderActivityDetail(activity) {
        // Formater la date
        const activityDate = new Date(activity.date);
        const formattedDate = activityDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Déterminer le titre et l'icône en fonction du type
        let typeTitle, icon;
        switch(activity.type) {
            case 'fractionne':
                typeTitle = 'Fractionné';
                icon = 'fas fa-tachometer-alt';
                break;
            case 'endurance':
                typeTitle = 'Endurance';
                icon = 'fas fa-road';
                break;
            case 'trail':
                typeTitle = 'Trail';
                icon = 'fas fa-mountain';
                break;
            default:
                typeTitle = 'Course';
                icon = 'fas fa-running';
        }
        
        // Créer le contenu HTML
        let detailHTML = `
            <div class="activity-card">
                <div class="activity-header">
                    <div class="activity-type ${activity.type}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-info">
                        <h3>${activity.title}</h3>
                        <p class="date">${formattedDate}</p>
                        <p class="type">${typeTitle}</p>
                    </div>
                </div>
                <div class="activity-stats">
                    <div class="stat">
                        <span class="label">Distance</span>
                        <span class="value">${activity.distance} km</span>
                    </div>
                    <div class="stat">
                        <span class="label">Durée</span>
                        <span class="value">${activity.duration}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Allure</span>
                        <span class="value">${activity.pace} /km</span>
                    </div>
                </div>
                ${activity.notes ? `
                <div class="activity-notes">
                    <h4>Notes</h4>
                    <p>${activity.notes}</p>
                </div>
                ` : ''}
        `;
        
        // Ajouter les détails des segments si disponibles
        if (activity.segments && activity.segments.length > 0) {
            detailHTML += `
                <div class="segments-list">
                    <h4>Détails des segments</h4>
            `;
            
            activity.segments.forEach((segment, index) => {
                const segmentName = segment.name || `Segment ${index + 1}`;
                const distanceDisplay = segment.unit === 'km' ? 
                    `${segment.distance} km` : 
                    `${segment.distance} m`;
                
                let recoveryText = '';
                if (segment.recovery) {
                    if (segment.recovery.type === 'distance') {
                        recoveryText = `Récupération: ${segment.recovery.value} ${segment.recovery.unit}`;
                    } else if (segment.recovery.type === 'time') {
                        recoveryText = `Récupération: ${segment.recovery.value}`;
                    }
                }
                
                detailHTML += `
                    <div class="segment-detail">
                        <div class="segment-detail-header">
                            <span class="segment-detail-name">${segmentName}</span>
                        </div>
                        <div class="segment-detail-stats">
                            <div class="segment-detail-stat">
                                <span class="label">Distance</span>
                                <span class="value">${distanceDisplay}</span>
                            </div>
                            <div class="segment-detail-stat">
                                <span class="label">Durée</span>
                                <span class="value">${segment.duration}</span>
                            </div>
                            <div class="segment-detail-stat">
                                <span class="label">Allure</span>
                                <span class="value">${segment.pace} /km</span>
                            </div>
                        </div>
                        ${recoveryText ? `<div class="segment-detail-recovery">${recoveryText}</div>` : ''}
                        ${segment.notes ? `<div class="segment-detail-notes">${segment.notes}</div>` : ''}
                    </div>
                `;
            });
            
            detailHTML += `</div>`;
        }
        
        detailHTML += `</div>`;
        
        activityDetailContent.innerHTML = detailHTML;
    }
    
    function createActivityCard(activity) {
        // Formater la date
        const activityDate = new Date(activity.date);
        const formattedDate = activityDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Créer la carte
        const card = document.createElement('div');
        card.className = `activity-card-simple ${activity.type}`;
        card.innerHTML = `
            <h3>${activity.title}</h3>
            <p class="date">${formattedDate}</p>
            <div class="quick-stats">
                <span>${activity.distance} km</span>
                <span>${activity.duration}</span>
            </div>
        `;
        
        // Ajouter l'événement de clic
        card.addEventListener('click', function() {
            currentActivityId = activity.id;
            renderActivityDetail(activity);
            switchView('activity-detail');
        });
        
        return card;
    }
    
    // Fonctions de gestion des segments
    function addSegment(segmentData = null) {
        // Cloner le template
        const segment = document.importNode(segmentTemplate.content, true).querySelector('.segment-item');
        
        // Remplir avec les données si fournies
        if (segmentData) {
            segment.querySelector('.segment-name').value = segmentData.name || '';
            segment.querySelector('.segment-distance').value = segmentData.distance || '';
            segment.querySelector('.segment-distance-unit').value = segmentData.unit || 'm';
            
            // Remplir la durée
            if (segmentData.duration) {
                const durationParts = segmentData.duration.split(':');
                if (durationParts.length === 2) {
                    segment.querySelector('.segment-minutes').value = durationParts[0];
                    segment.querySelector('.segment-seconds').value = durationParts[1];
                }
            }
            
            // Remplir la récupération
            if (segmentData.recovery) {
                segment.querySelector('.recovery-type').value = segmentData.recovery.type;
                
                if (segmentData.recovery.type === 'distance') {
                    segment.querySelector('.recovery-distance-inputs').style.display = 'flex';
                    segment.querySelector('.recovery-distance').value = segmentData.recovery.value;
                    segment.querySelector('.recovery-distance-unit').value = segmentData.recovery.unit;
                } else if (segmentData.recovery.type === 'time') {
                    segment.querySelector('.recovery-time-inputs').style.display = 'flex';
                    const recoveryTimeParts = segmentData.recovery.value.split(':');
                    if (recoveryTimeParts.length === 2) {
                        segment.querySelector('.recovery-minutes').value = recoveryTimeParts[0];
                        segment.querySelector('.recovery-seconds').value = recoveryTimeParts[1];
                    }
                }
            }
            
            segment.querySelector('.segment-notes').value = segmentData.notes || '';
        }
        
        // Gérer l'affichage des champs de récupération en fonction du type
        const recoveryTypeSelect = segment.querySelector('.recovery-type');
        recoveryTypeSelect.addEventListener('change', function() {
            const distanceInputs = segment.querySelector('.recovery-distance-inputs');
            const timeInputs = segment.querySelector('.recovery-time-inputs');
            
            if (this.value === 'distance') {
                distanceInputs.style.display = 'flex';
                timeInputs.style.display = 'none';
            } else if (this.value === 'time') {
                distanceInputs.style.display = 'none';
                timeInputs.style.display = 'flex';
            } else {
                distanceInputs.style.display = 'none';
                timeInputs.style.display = 'none';
            }
        });
        
        // Ajouter l'écouteur d'événement pour supprimer le segment
        segment.querySelector('.remove-segment').addEventListener('click', function() {
            segmentsContainer.removeChild(segment);
        });
        
        // Ajouter le segment au conteneur
        segmentsContainer.appendChild(segment);
    }
    
    // Fonction pour collecter les données des segments
    function collectSegmentsData() {
        const segments = [];
        const segmentElements = segmentsContainer.querySelectorAll('.segment-item');
        
        segmentElements.forEach(segment => {
            const name = segment.querySelector('.segment-name').value;
            const distance = parseFloat(segment.querySelector('.segment-distance').value);
            const unit = segment.querySelector('.segment-distance-unit').value;
            const minutes = parseInt(segment.querySelector('.segment-minutes').value) || 0;
            const seconds = parseInt(segment.querySelector('.segment-seconds').value) || 0;
            
            // Calculer la durée en secondes
            const durationInSeconds = minutes * 60 + seconds;
            
            // Formater la durée
            const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Calculer l'allure
            let pace = '';
            if (distance > 0) {
                const distanceInKm = unit === 'km' ? distance : distance / 1000;
                const paceInSeconds = durationInSeconds / distanceInKm;
                const paceMinutes = Math.floor(paceInSeconds / 60);
                const paceSeconds = Math.floor(paceInSeconds % 60);
                pace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
            }
            
            // Récupérer les données de récupération
            const recoveryType = segment.querySelector('.recovery-type').value;
            let recovery = null;
            
            if (recoveryType === 'distance') {
                const recoveryDistance = parseFloat(segment.querySelector('.recovery-distance').value) || 0;
                const recoveryUnit = segment.querySelector('.recovery-distance-unit').value;
                recovery = {
                    type: 'distance',
                    value: recoveryDistance,
                    unit: recoveryUnit
                };
            } else if (recoveryType === 'time') {
                const recoveryMinutes = parseInt(segment.querySelector('.recovery-minutes').value) || 0;
                const recoverySeconds = parseInt(segment.querySelector('.recovery-seconds').value) || 0;
                recovery = {
                    type: 'time',
                    value: `${recoveryMinutes}:${recoverySeconds.toString().padStart(2, '0')}`,
                    unit: 's'
                };
            }
            
            const notes = segment.querySelector('.segment-notes').value;
            
            segments.push({
                name,
                distance,
                unit,
                duration,
                durationInSeconds,
                pace,
                recovery,
                notes
            });
        });
        
        return segments;
    }
    
    // Fonctions de gestion des formulaires
    function fillFormWithActivity(activity) {
        document.getElementById('activity-id').value = activity.id;
        document.getElementById('activity-title').value = activity.title;
        document.getElementById('activity-date').value = activity.date;
        document.getElementById('activity-type').value = activity.type;
        document.getElementById('activity-distance').value = activity.distance;
        
        // Remplir la durée
        const durationParts = activity.duration.split(':');
        if (durationParts.length === 3) {
            document.getElementById('activity-hours').value = durationParts[0];
            document.getElementById('activity-minutes').value = durationParts[1];
            document.getElementById('activity-seconds').value = durationParts[2];
        } else if (durationParts.length === 2) {
            document.getElementById('activity-hours').value = '';
            document.getElementById('activity-minutes').value = durationParts[0];
            document.getElementById('activity-seconds').value = durationParts[1];
        }
        
        document.getElementById('activity-notes').value = activity.notes || '';
        
        // Vider les segments existants
        segmentsContainer.innerHTML = '';
        
        // Ajouter les segments si disponibles
        if (activity.segments && activity.segments.length > 0) {
            activity.segments.forEach(segment => {
                addSegment(segment);
            });
        } else {
            // Ajouter un segment vide par défaut
            addSegment();
        }
    }
    
    function saveActivity() {
        // Récupérer les valeurs du formulaire
        const id = document.getElementById('activity-id').value || Date.now().toString();
        const title = document.getElementById('activity-title').value;
        const date = document.getElementById('activity-date').value;
        const type = document.getElementById('activity-type').value;
        const distance = parseFloat(document.getElementById('activity-distance').value);
        const hours = parseInt(document.getElementById('activity-hours').value) || 0;
        const minutes = parseInt(document.getElementById('activity-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('activity-seconds').value) || 0;
        const notes = document.getElementById('activity-notes').value;
        
        // Calculer la durée totale en secondes
        const durationInSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // Calculer l'allure (min/km)
        const paceInSeconds = durationInSeconds / distance;
        const paceMinutes = Math.floor(paceInSeconds / 60);
        const paceSeconds = Math.floor(paceInSeconds % 60);
        const pace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
        
        // Formater la durée
        const duration = `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Récupérer les segments
        const segments = collectSegmentsData();
        
        // Créer l'objet d'activité
        const activity = {
            id: parseInt(id),
            title,
            date,
            type,
            distance,
            duration,
            pace,
            notes,
            durationInSeconds,
            segments
        };
        
        // Mettre à jour ou ajouter l'activité
        if (editMode) {
            const index = activities.findIndex(a => a.id === parseInt(id));
            if (index !== -1) {
                activities[index] = activity;
            }
        } else {
            activities.unshift(activity);
        }
        
        // Sauvegarder et mettre à jour l'interface
        saveActivities();
        updateStats();
        renderRecentActivities();
        renderFilteredActivities();
        
        // Revenir à la vue précédente
        switchView(currentView);
    }
    
    // Fonctions utilitaires
    function saveActivities() {
        localStorage.setItem('runActivities', JSON.stringify(activities));
    }
    
    function updateStats() {
        // Mettre à jour le nombre total d'activités
        totalActivitiesElement.textContent = activities.length;
        
        // Calculer la distance totale
        const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0);
        totalDistanceElement.textContent = totalDistance.toFixed(1);
    }
    
    function sortActivitiesList(activitiesList, sortValue) {
        const sortedList = [...activitiesList];
        
        switch(sortValue) {
            case 'date-desc':
                sortedList.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                sortedList.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'distance-desc':
                sortedList.sort((a, b) => b.distance - a.distance);
                break;
            case 'distance-asc':
                sortedList.sort((a, b) => a.distance - b.distance);
                break;
        }
        
        return sortedList;
    }
});
