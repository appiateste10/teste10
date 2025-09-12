// Funções comuns para todas as páginas - LisboaGo Taxi Service

// Configuração dos motoristas (acessível globalmente)
const drivers = {
    "Mega": {
        password: "12345",
        phone: "351939354112",
        activeHours: [13, 21],
        car: "Logan 62-QM-79",
        color: "#FF6B6B"
    },
    "Heitor": {
        password: "12345",
        phone: "351910603136",
        activeHours: [5, 13],
        car: "Logan 62-QM-79",
        color: "#4ECDC4"
    },
    "Xavier": {
        password: "12345",
        phone: "351967029637",
        activeHours: [21, 29],
        car: "Logan 62-QM-79",
        color: "#45B7D1"
    }
};

// Variáveis globais
let onlineTimeInterval = null;
let startOnlineTime = null;
let currentRides = 0;
let totalKm = 0;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
    setupGlobalEventListeners();
});

// Inicializar aplicação
function initializeApplication() {
    console.log('🚕 Iniciando LisboaGo Taxi Service...');
    
    // Inicializar funcionalidades baseadas na página
    if (document.getElementById('currentDateTime')) {
        startDateTimeUpdates();
    }
    
    if (window.location.pathname.includes('formulario.html') || window.location.hash.includes('formulario')) {
        initializeFormPage();
    }
    
    if (window.location.pathname.includes('motorista.html')) {
        initializeDriverPage();
    }
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        initializeHomePage();
    }
    
    // Verificar autenticação em páginas protegidas
    checkAuthentication();
    
    // Iniciar monitoramento de performance
    startPerformanceMonitoring();
}

// Configurar event listeners globais
function setupGlobalEventListeners() {
    // Monitorar conexão
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Prevenir ações acidentais
    document.addEventListener('keydown', handleGlobalKeyboardShortcuts);
    
    // Gerenciar visibilidade da página
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Atualizar data e hora em tempo real
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Lisbon'
    };
    
    const dateTimeStr = now.toLocaleDateString('pt-PT', options);
    const timeOnlyStr = now.toLocaleTimeString('pt-PT');
    
    const dateTimeElement = document.getElementById('currentDateTime');
    const timeOnlyElement = document.getElementById('currentTime');
    
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeStr;
    }
    if (timeOnlyElement) {
        timeOnlyElement.textContent = timeOnlyStr;
    }
    
    // Atualizar último check do sistema
    const lastCheckElement = document.getElementById('lastCheck');
    if (lastCheckElement) {
        lastCheckElement.textContent = timeOnlyStr;
    }
}

// Iniciar atualização de data e hora
function startDateTimeUpdates() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    console.log('⏰ Atualização de data/hora iniciada');
}

// Inicializar página do formulário
function initializeFormPage() {
    console.log('📋 Inicializando página de formulário...');
    
    generateWhatsAppButtons();
    setupFormValidation();
    setupAddressAutocomplete();
    setupFormAutoSave();
    
    // Adicionar botão de localização automática
    addCurrentLocationButtons();
}

// Inicializar página do motorista
function initializeDriverPage() {
    console.log('👨‍✈️ Inicializando área do motorista...');
    
    startOnlineTimeTracking();
    setupDriverStats();
    setupMapControls();
}

// Inicializar página inicial
function initializeHomePage() {
    console.log('🏠 Inicializando página inicial...');
    
    setupMapInteractions();
    setupQuickActions();
    showWelcomeNotification();
}

// Verificar autenticação
function checkAuthentication() {
    const protectedPages = ['motorista.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const currentDriver = sessionStorage.getItem('currentDriver');
        if (!currentDriver || !drivers[currentDriver]) {
            window.location.href = 'login.html';
            return false;
        }
    }
    return true;
}

// Gerar botões de WhatsApp para o formulário
function generateWhatsAppButtons() {
    const buttonsContainer = document.getElementById('driverButtons');
    if (!buttonsContainer) return;
    
    console.log('📱 Gerando botões do WhatsApp...');
    
    buttonsContainer.innerHTML = '';
    const driversContainer = document.createElement('div');
    driversContainer.className = 'driver-buttons-container';
    
    let activeDrivers = 0;
    
    for (const [name, info] of Object.entries(drivers)) {
        const isActive = isDriverActive(info.activeHours);
        
        const button = document.createElement('button');
        button.className = `driver-button ${isActive ? '' : 'hidden'}`;
        button.innerHTML = `
            <div style="text-align: left;">
                <strong>${name}</strong>
                <br>
                <small>${isActive ? '🟢 Online' : '🔴 Offline'}</small>
            </div>
        `;
        
        button.disabled = !isActive;
        
        if (isActive) {
            activeDrivers++;
            button.onclick = function() {
                sendWhatsAppMessage(info.phone, name);
            };
            
            // Adicionar tooltip
            button.title = `Enviar solicitação para ${name} (${info.phone})`;
        } else {
            button.title = `Motorista ${name} está offline. Horário: ${formatActiveHours(info.activeHours)}`;
        }
        
        driversContainer.appendChild(button);
    }
    
    buttonsContainer.appendChild(driversContainer);
    
    // Mensagem se não houver motoristas ativos
    if (activeDrivers === 0) {
        const message = document.createElement('div');
        message.style.textAlign = 'center';
        message.style.padding = '2rem';
        message.style.color = '#666';
        message.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">😴</div>
            <h3>Nenhum motorista disponível no momento</h3>
            <p>Volte durante o horário de funcionamento</p>
        `;
        buttonsContainer.appendChild(message);
    }
}

// Formatador de horários ativos
function formatActiveHours(hours) {
    if (hours[1] < hours[0]) {
        return `${hours[0]}:00 - ${hours[1]}:00 (próximo dia)`;
    } else {
        return `${hours[0]}:00 - ${hours[1]}:00`;
    }
}

// Configurar validação do formulário
function setupFormValidation() {
    const form = document.getElementById('taxiForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('invalid')) {
                this.classList.remove('invalid');
                const errorElement = this.nextElementSibling;
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.remove();
                }
            }
        });
    });
    
    // Validação em tempo real para telefone
    const phoneInput = document.getElementById('contact');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^\d+]/g, '');
        });
    }
}

// Validar campo individual
function validateField(field) {
    let isValid = true;
    let errorMessage = '';
    
    if (!field.value.trim()) {
        isValid = false;
        errorMessage = 'Este campo é obrigatório';
    } else if (field.type === 'tel') {
        isValid = validatePhoneNumber(field.value);
        errorMessage = 'Número de telefone inválido';
    } else if (field.type === 'email') {
        isValid = validateEmail(field.value);
        errorMessage = 'Email inválido';
    }
    
    if (!isValid) {
        field.classList.add('invalid');
        showFieldError(field, errorMessage);
    } else {
        field.classList.remove('invalid');
        removeFieldError(field);
    }
    
    return isValid;
}

// Validar número de telefone
function validatePhoneNumber(phone) {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
}

// Validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar erro de campo
function showFieldError(field, message) {
    removeFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#f44336';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.marginTop = '0.3rem';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

// Remover erro de campo
function removeFieldError(field) {
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// Configurar autocomplete de endereços
function setupAddressAutocomplete() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.warn('Google Places API não carregada');
        setTimeout(setupAddressAutocomplete, 1000);
        return;
    }
    
    const locationInput = document.getElementById('location');
    const destinationInput = document.getElementById('destination');
    
    if (locationInput && !locationInput._autocomplete) {
        locationInput._autocomplete = new google.maps.places.Autocomplete(locationInput, {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'pt' }
        });
        
        locationInput._autocomplete.addListener('place_changed', function() {
            const place = this.getPlace();
            if (place.geometry && window.map) {
                window.map.setCenter(place.geometry.location);
                window.map.setZoom(15);
            }
        });
    }
    
    if (destinationInput && !destinationInput._autocomplete) {
        destinationInput._autocomplete = new google.maps.places.Autocomplete(destinationInput, {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'pt' }
        });
    }
}

// Configurar auto-salvamento do formulário
function setupFormAutoSave() {
    const form = document.getElementById('taxiForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    const storageKey = 'lisboago_form_data';
    
    // Carregar dados salvos
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = data[key];
                }
            });
        } catch (e) {
            console.error('Erro ao carregar dados do formulário:', e);
        }
    }
    
    // Salvar dados automaticamente
    inputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            saveFormData();
        }, 500));
    });
    
    // Limpar dados ao enviar o formulário
    form.addEventListener('submit', function() {
        localStorage.removeItem(storageKey);
    });
}

// Salvar dados do formulário
function saveFormData() {
    const form = document.getElementById('taxiForm');
    if (!form) return;
    
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.name || input.id) {
            const key = input.id || input.name;
            formData[key] = input.value;
        }
    });
    
    localStorage.setItem('lisboago_form_data', JSON.stringify(formData));
}

// Adicionar botões de localização atual
function addCurrentLocationButtons() {
    const locationInput = document.getElementById('location');
    
    if (locationInput && 'geolocation' in navigator) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        
        locationInput.parentNode.insertBefore(wrapper, locationInput);
        wrapper.appendChild(locationInput);
        
        const locationButton = document.createElement('button');
        locationButton.innerHTML = '📍';
        locationButton.style.position = 'absolute';
        locationButton.style.right = '10px';
        locationButton.style.top = '50%';
        locationButton.style.transform = 'translateY(-50%)';
        locationButton.style.background = 'none';
        locationButton.style.border = 'none';
        locationButton.style.cursor = 'pointer';
        locationButton.style.fontSize = '1.2rem';
        locationButton.title = 'Usar minha localização atual';
        
        locationButton.addEventListener('click', function() {
            getCurrentLocationForInput(locationInput);
        });
        
        wrapper.appendChild(locationButton);
    }
}

// Obter localização atual para input
function getCurrentLocationForInput(inputElement) {
    if (!('geolocation' in navigator)) {
        alert('Geolocalização não suportada pelo navegador');
        return;
    }
    
    showNotification('Obtendo sua localização...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Usar Geocoding para obter endereço
            if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                const latlng = { lat: lat, lng: lng };
                
                geocoder.geocode({ location: latlng }, function(results, status) {
                    if (status === 'OK' && results[0]) {
                        inputElement.value = results[0].formatted_address;
                        showNotification('Localização definida com sucesso!', 'success');
                    } else {
                        inputElement.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        showNotification('Localização definida (coordenadas)', 'info');
                    }
                });
            } else {
                inputElement.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                showNotification('Localização definida (coordenadas)', 'info');
            }
        },
        function(error) {
            handleGeolocationError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Iniciar tracking de tempo online
function startOnlineTimeTracking() {
    if (onlineTimeInterval) {
        clearInterval(onlineTimeInterval);
    }
    
    startOnlineTime = new Date();
    updateOnlineTime();
    
    onlineTimeInterval = setInterval(updateOnlineTime, 1000);
}

// Atualizar tempo online
function updateOnlineTime() {
    if (!startOnlineTime) return;
    
    const now = new Date();
    const diff = now - startOnlineTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const onlineTimeElement = document.getElementById('onlineTime');
    if (onlineTimeElement) {
        onlineTimeElement.textContent = timeString;
    }
}

// Configurar estatísticas do motorista
function setupDriverStats() {
    // Carregar estatísticas salvas
    const savedStats = localStorage.getItem('lisboago_driver_stats');
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            currentRides = stats.rides || 0;
            totalKm = stats.km || 0;
            
            updateStatsDisplay();
        } catch (e) {
            console.error('Erro ao carregar estatísticas:', e);
        }
    }
    
    // Simular novas corridas (em produção, isso viria do servidor)
    setInterval(simulateNewRide, 30000);
}

// Atualizar display de estatísticas
function updateStatsDisplay() {
    document.getElementById('ridesCount').textContent = currentRides;
    document.getElementById('kmDriven').textContent = `${totalKm} km`;
}

// Simular nova corrida (para demonstração)
function simulateNewRide() {
    if (Math.random() > 0.7) { // 30% de chance a cada 30 segundos
        currentRides++;
        totalKm += (5 + Math.floor(Math.random() * 20)); // 5-25 km
        
        updateStatsDisplay();
        saveDriverStats();
        
        showNotification(`🏁 Nova corrida realizada! Total: ${currentRides}`, 'success');
    }
}

// Salvar estatísticas do motorista
function saveDriverStats() {
    const stats = {
        rides: currentRides,
        km: totalKm,
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('lisboago_driver_stats', JSON.stringify(stats));
}

// Configurar controles do mapa
function setupMapControls() {
    const mapLocationBtn = document.getElementById('mapLocationBtn');
    if (mapLocationBtn) {
        mapLocationBtn.addEventListener('click', centerMapOnUser);
    }
}

// Centralizar mapa no usuário
function centerMapOnUser() {
    if ('geolocation' in navigator && window.map) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                window.map.setCenter(userLocation);
                window.map.setZoom(16);
                
                showNotification('Mapa centralizado na sua localização', 'success');
            },
            function(error) {
                handleGeolocationError(error);
            }
        );
    }
}

// Configurar interações do mapa na página inicial
function setupMapInteractions() {
    // Adicionar listeners para interações com o mapa
    setTimeout(() => {
        if (window.map) {
            window.map.addListener('click', function() {
                console.log('Mapa clicado');
            });
        }
    }, 2000);
}

// Configurar ações rápidas
function setupQuickActions() {
    // Adicionar tooltips para botões
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.title && button.textContent.trim()) {
            button.title = button.textContent.trim();
        }
    });
}

// Mostrar notificação de boas-vindas
function showWelcomeNotification() {
    if (!sessionStorage.getItem('welcome_shown')) {
        setTimeout(() => {
            showNotification('Bem-vindo ao LisboaGo! Seu táxi em Lisboa quando precisar.', 'info');
            sessionStorage.setItem('welcome_shown', 'true');
        }, 2000);
    }
}

// Enviar mensagem via WhatsApp
function sendWhatsAppMessage(phone, driverName) {
    const form = document.getElementById('taxiForm');
    if (!form) {
        showNotification('Formulário não encontrado', 'error');
        return;
    }
    
    // Validar todos os campos obrigatórios
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Por favor, preencha todos os campos obrigatórios corretamente', 'error');
        return;
    }
    
    // Coletar dados do formulário
    const formData = {
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        destination: document.getElementById('destination').value,
        passengers: document.getElementById('passengers').value,
        contact: document.getElementById('contact').value,
        eta: document.getElementById('eta').value,
        payment: document.getElementById('payment').value,
        notes: document.getElementById('notes').value || 'Nenhuma observação'
    };
    
    // Criar mensagem formatada
    const message = `*Solicitação de Táxi - LisboaGo*%0A%0A` +
                    `*Nome:* ${formData.name}%0A` +
                    `*Localização:* ${formData.location}%0A` +
                    `*Destino:* ${formData.destination}%0A` +
                    `*Passageiros:* ${formData.passengers}%0A` +
                    `*Contato:* ${formData.contact}%0A` +
                    `*Tempo de Chegada:* ${formData.eta}%0A` +
                    `*Pagamento:* ${formData.payment}%0A` +
                    `*Observações:* ${formData.notes}%0A%0A` +
                    `_Enviado via LisboaGo App_`;
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Registrar a solicitação
    console.log(`✉️ Mensagem enviada para ${driverName} (${phone})`);
    showNotification(`Mensagem enviada para ${driverName}`, 'success');
}

// Handler para status online
function handleOnlineStatus() {
    showNotification('Conexão restaurada', 'success');
    updateConnectionStatus(true);
}

// Handler para status offline
function handleOfflineStatus() {
    showNotification('Sem conexão com a internet', 'warning');
    updateConnectionStatus(false);
}

// Atualizar status da conexão
function updateConnectionStatus(isOnline) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = isOnline ? '✅ Online' : '⚠️ Offline';
        statusElement.style.color = isOnline ? 'green' : 'orange';
    }
}

// Handler para atalhos de teclado
function handleGlobalKeyboardShortcuts(e) {
    // Ctrl+Alt+L - Focar no campo de localização
    if (e.ctrlKey && e.altKey && e.key === 'l') {
        const locationInput = document.getElementById('location');
        if (locationInput) {
            locationInput.focus();
            e.preventDefault();
        }
    }
    
    // Ctrl+Alt+D - Focar no destino
    if (e.ctrlKey && e.altKey && e.key === 'd') {
        const destinationInput = document.getElementById('destination');
        if (destinationInput) {
            destinationInput.focus();
            e.preventDefault();
        }
    }
}

// Handler para mudança de visibilidade
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('📱 Aplicação em segundo plano');
    } else {
        console.log('📱 Aplicação em primeiro plano');
        updateDateTime();
    }
}

// Iniciar monitoramento de performance
function startPerformanceMonitoring() {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        console.log(`⚡ Tempo de carregamento: ${loadTime}ms`);
        
        if (loadTime > 3000) {
            console.warn('⚠️ Tempo de carregamento lento');
        }
    }
}

// Função debounce para otimização
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handler de erro de geolocalização
function handleGeolocationError(error) {
    let errorMsg = 'Erro ao obter localização';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível';
            break;
        case error.TIMEOUT:
            errorMsg = 'Tempo limite excedido';
            break;
    }
    
    showNotification(errorMsg, 'error');
    console.error('❌ Erro de geolocalização:', errorMsg);
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Implementação simplificada - será sobreposta pela implementação no auth.js
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Fallback básico se não houver sistema de notificação
    if (typeof window.showNotification !== 'function') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Verificar se um motorista está ativo
function isDriverActive(activeHours) {
    const now = new Date();
    const lisbonTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Lisbon"}));
    const currentHour = lisbonTime.getHours();
    
    if (activeHours[1] < activeHours[0]) {
        return currentHour >= activeHours[0] || currentHour < activeHours[1];
    } else {
        return currentHour >= activeHours[0] && currentHour < activeHours[1];
    }
}

// Carregar Google Maps API
function loadGoogleMaps() {
    return new Promise((resolve, reject) => {
        if (typeof google !== 'undefined' && google.maps) {
            resolve();
            return;
        }
        
        if (document.querySelector('script[src*="googleapis"]')) {
            // Já está carregando
            const checkInterval = setInterval(() => {
                if (typeof google !== 'undefined' && google.maps) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBmc6HTJo70N_ueR1qFVgyu74v7FIl7dU4&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        script.onload = resolve;
        script.onerror = reject;
        
        document.head.appendChild(script);
    });
}

// Exportar funções globais
window.LisboaGo = {
    drivers,
    showNotification,
    isDriverActive,
    loadGoogleMaps,
    validatePhoneNumber,
    validateEmail,
    debounce
};

console.log('✅ script.js carregado com sucesso');