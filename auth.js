// Sistema de autenticação e gerenciamento do motorista - LisboaGo

// Configuração dos motoristas
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
let watchId = null;
let isTracking = false;
let isOnline = false;
let currentPosition = null;
let positionUpdateInterval = null;
let onlineTimeInterval = null;
let startOnlineTime = null;

// Função de autenticação
function authenticate(username, password) {
    return drivers[username] && drivers[username].password === password;
}

// Verificar se um motorista está ativo no momento
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

// Função para formatar data e hora
function formatDateTime(date) {
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
    return date.toLocaleDateString('pt-PT', options);
}

// Função para atualizar informações de posição
function updatePositionInfo(lat, lng) {
    const positionInfo = document.getElementById('positionInfo');
    if (positionInfo) {
        positionInfo.innerHTML = `
            <strong>Última atualização:</strong> ${new Date().toLocaleTimeString('pt-PT')}<br>
            <strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
            <strong>Status:</strong> <span style="color: green;">● Transmitindo</span>
        `;
        
        // Também tentar obter o endereço
        if (window.getAddressFromCoords) {
            window.getAddressFromCoords(lat, lng, function(address) {
                positionInfo.innerHTML += `<br><strong>Localização:</strong> ${address}`;
            });
        }
    }
}

// Tornar funções disponíveis globalmente
window.authenticate = authenticate;
window.isDriverActive = isDriverActive;
window.updatePositionInfo = updatePositionInfo;

// Gerenciamento de login e sessão
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Iniciando sistema de autenticação...');
    
    const loginForm = document.getElementById('loginForm');
    
    // Verificar se já está logado
    checkExistingSession();
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLoginSubmit();
        });
    }
    
    // Verificar se o usuário está logado na área do motorista
    if (window.location.pathname.includes('motorista.html')) {
        initializeDriverDashboard();
    }
});

// Handler de submit do login
function handleLoginSubmit() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (authenticate(username, password)) {
        handleSuccessfulLogin(username);
    } else {
        showLoginError('Usuário ou senha incorretos!');
    }
}

// Verificar sessão existente
function checkExistingSession() {
    const currentDriver = sessionStorage.getItem('currentDriver');
    if (currentDriver && drivers[currentDriver] && window.location.pathname.includes('login.html')) {
        window.location.href = 'motorista.html';
    }
}

// Manipular login bem-sucedido
function handleSuccessfulLogin(username) {
    sessionStorage.setItem('currentDriver', username);
    sessionStorage.setItem('driverCar', drivers[username].car);
    sessionStorage.setItem('driverPhone', drivers[username].phone);
    sessionStorage.setItem('driverColor', drivers[username].color);
    sessionStorage.setItem('lastLogin', new Date().toISOString());
    
    // Adicionar efeito visual de sucesso
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    if (loginButton) {
        loginButton.innerHTML = '✓ Login bem-sucedido!';
        loginButton.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            window.location.href = 'motorista.html';
        }, 1000);
    } else {
        window.location.href = 'motorista.html';
    }
}

// Mostrar erro de login
function showLoginError(message) {
    const errorMsg = document.getElementById('errorMsg');
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
    
    if (loginButton) {
        loginButton.innerHTML = '❌ Erro no login';
        loginButton.style.backgroundColor = '#F44336';
        
        setTimeout(() => {
            loginButton.innerHTML = 'Entrar';
            loginButton.style.backgroundColor = '';
        }, 2000);
    }
}

// Inicializar dashboard do motorista
function initializeDriverDashboard() {
    console.log('🚗 Inicializando dashboard do motorista...');
    
    const currentDriver = sessionStorage.getItem('currentDriver');
    
    if (!currentDriver || !drivers[currentDriver]) {
        redirectToLogin();
        return;
    }
    
    // Configurar interface do motorista
    setupDriverInterface(currentDriver);
    
    // Configurar event listeners
    setupEventListeners();
    
    // Iniciar serviços em segundo plano
    startBackgroundServices();
    
    // Verificar status anterior
    checkPreviousStatus();
}

// Verificar status anterior da sessão
function checkPreviousStatus() {
    const wasOnline = sessionStorage.getItem('trackingStatus') === 'online';
    const toggleOnlineBtn = document.getElementById('toggleOnline');
    
    if (wasOnline && toggleOnlineBtn) {
        console.log('🔄 Restaurando status online anterior...');
        // Simular clique no botão após um pequeno delay
        setTimeout(() => {
            if (toggleOnlineBtn && !isOnline) {
                toggleOnlineBtn.click();
            }
        }, 1000);
    }
}

// Redirecionar para login
function redirectToLogin() {
    console.log('🔒 Redirecionando para login...');
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Configurar interface do motorista
function setupDriverInterface(username) {
    console.log('🎨 Configurando interface para:', username);
    
    // Preencher informações do motorista
    document.getElementById('driverName').textContent = username;
    document.getElementById('driverPhone').textContent = sessionStorage.getItem('driverPhone');
    document.getElementById('driverCar').textContent = sessionStorage.getItem('driverCar');
    
    // Aplicar cor personalizada
    const driverColor = sessionStorage.getItem('driverColor');
    if (driverColor) {
        applyDriverColor(driverColor);
    }
    
    // Atualizar data e hora em tempo real
    startDateTimeUpdates();
}

// Aplicar cor personalizada do motorista
function applyDriverColor(color) {
    document.documentElement.style.setProperty('--driver-color', color);
    
    // Aplicar a cor em elementos específicos
    const elements = document.querySelectorAll('.driver-actions button, .drag-handle');
    elements.forEach(element => {
        element.style.backgroundColor = color;
    });
}

// Configurar event listeners
function setupEventListeners() {
    console.log('🎯 Configurando event listeners...');
    
    // Botão de logout - CORREÇÃO PRINCIPAL
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('✅ Botão de logout configurado');
    } else {
        console.error('❌ Botão de logout não encontrado');
    }
    
    // Botão de online/offline - CORREÇÃO PRINCIPAL
    const toggleOnlineBtn = document.getElementById('toggleOnline');
    const startTrackingBtn = document.getElementById('startTracking');
    
    if (toggleOnlineBtn) {
        toggleOnlineBtn.addEventListener('click', handleOnlineToggle);
        console.log('✅ Botão online/offline configurado');
    } else {
        console.error('❌ Botão online/offline não encontrado');
    }
    
    // Botão de iniciar rastreamento
    if (startTrackingBtn) {
        startTrackingBtn.addEventListener('click', handleStartTracking);
        console.log('✅ Botão de rastreamento configurado');
    }
    
    // Botão de localização atual
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', getCurrentLocation);
        console.log('✅ Botão de localização configurado');
    }
    
    // Botão de localização no mapa
    const mapLocationBtn = document.getElementById('mapLocationBtn');
    if (mapLocationBtn) {
        mapLocationBtn.addEventListener('click', centerMapOnLocation);
        console.log('✅ Botão de mapa configurado');
    }
}

// Handler para toggle online/offline - CORREÇÃO PRINCIPAL
function handleOnlineToggle() {
    console.log('🔄 Alternando status online/offline...');
    isOnline = !isOnline;
    updateOnlineStatusUI();
    
    if (isOnline) {
        goOnline();
    } else {
        goOffline();
    }
}

// Handler para iniciar rastreamento
function handleStartTracking() {
    console.log('📍 Iniciando rastreamento...');
    if (isOnline) {
        startContinuousTracking();
        showNotification('Rastreamento contínuo ativado! Sua localização será atualizada automaticamente.', 'success');
    } else {
        showNotification('Por favor, fique online primeiro para iniciar o rastreamento.', 'warning');
    }
}

// Handler para logout - CORREÇÃO PRINCIPAL
function handleLogout() {
    console.log('🚪 Saindo da aplicação...');
    
    // Parar todos os serviços
    stopTracking();
    stopAllIntervals();
    
    // Mostrar confirmação
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar sessão
        sessionStorage.clear();
        localStorage.removeItem('trackingStatus');
        
        // Redirecionar para página inicial
        showNotification('Sessão encerrada com sucesso', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Atualizar UI do status online/offline
function updateOnlineStatusUI() {
    const toggleOnlineBtn = document.getElementById('toggleOnline');
    const startTrackingBtn = document.getElementById('startTracking');
    const statusElement = document.getElementById('driverStatus');
    
    if (!toggleOnlineBtn || !statusElement) return;
    
    if (isOnline) {
        // Modo online
        toggleOnlineBtn.textContent = 'Ficar Offline';
        toggleOnlineBtn.style.backgroundColor = '#6b7280';
        toggleOnlineBtn.style.color = 'white';
        
        if (startTrackingBtn) {
            startTrackingBtn.disabled = false;
        }
        
        statusElement.textContent = 'Online';
        statusElement.style.color = 'green';
        
    } else {
        // Modo offline
        toggleOnlineBtn.textContent = 'Ficar Online';
        toggleOnlineBtn.style.backgroundColor = '#ffd700';
        toggleOnlineBtn.style.color = '#333';
        
        if (startTrackingBtn) {
            startTrackingBtn.disabled = true;
        }
        
        statusElement.textContent = 'Offline';
        statusElement.style.color = 'red';
    }
}

// Entrar no modo online
function goOnline() {
    console.log('🟢 Entrando no modo online...');
    sessionStorage.setItem('trackingStatus', 'online');
    startTracking();
    startOnlineTimeTracking();
    showNotification('Você está online! Os passageiros podem ver sua localização.', 'success');
}

// Entrar no modo offline
function goOffline() {
    console.log('🔴 Entrando no modo offline...');
    sessionStorage.setItem('trackingStatus', 'offline');
    stopTracking();
    stopOnlineTimeTracking();
    showNotification('Você está offline. Os passageiros não podem ver sua localização.', 'info');
}

// Iniciar atualizações de data e hora
function startDateTimeUpdates() {
    function updateDateTime() {
        document.getElementById('currentDateTime').textContent = formatDateTime(new Date());
    }
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
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

// Parar tracking de tempo online
function stopOnlineTimeTracking() {
    if (onlineTimeInterval) {
        clearInterval(onlineTimeInterval);
        onlineTimeInterval = null;
    }
    startOnlineTime = null;
}

// Iniciar serviços em segundo plano
function startBackgroundServices() {
    // Verificar conexão periodicamente
    setInterval(checkConnectionStatus, 30000);
    
    // Atualizar informações do sistema
    setInterval(updateSystemInfo, 5000);
}

// Verificar status da conexão
function checkConnectionStatus() {
    if (navigator.onLine) {
        if (isTracking) {
            console.log('✅ Conexão estável - Transmitindo localização');
        }
    } else {
        console.warn('⚠️ Sem conexão com a internet');
        showNotification('Conexão perdida. Tentando reconectar...', 'warning');
    }
}

// Atualizar informações do sistema
function updateSystemInfo() {
    const systemInfo = document.getElementById('systemInfo');
    if (systemInfo) {
        systemInfo.innerHTML = `
            <strong>Status:</strong> ${navigator.onLine ? '✅ Online' : '⚠️ Offline'}<br>
            <strong>Última verificação:</strong> ${new Date().toLocaleTimeString('pt-PT')}<br>
            <strong>Motorista:</strong> ${sessionStorage.getItem('currentDriver')}
        `;
    }
}

// Centralizar mapa na localização atual
function centerMapOnLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                if (window.map && window.driverMarker) {
                    window.map.setCenter(location);
                    window.driverMarker.setPosition(location);
                    showNotification('Mapa centralizado na sua localização atual', 'success');
                }
            },
            function(error) {
                handleGeolocationError(error);
            }
        );
    }
}

// Obter localização atual
function getCurrentLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const { latitude, longitude } = position.coords;
                
                if (window.updateDriverLocation) {
                    window.updateDriverLocation(latitude, longitude);
                    showNotification('Localização atual atualizada!', 'success');
                }
            },
            function(error) {
                handleGeolocationError(error);
            },
            { enableHighAccuracy: true }
        );
    }
}

// Iniciar rastreamento
function startTracking() {
    console.log('📍 Iniciando serviço de rastreamento...');
    
    if ('geolocation' in navigator) {
        // Primeiro obtenha a localização atual
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentPosition = position;
                const { latitude, longitude } = position.coords;
                
                // Atualizar o marcador no mapa
                if (window.updateDriverLocation) {
                    window.updateDriverLocation(latitude, longitude);
                }
                
                // Iniciar rastreamento contínuo
                startContinuousTracking();
                
                console.log('✅ Rastreamento iniciado');
                isTracking = true;
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
    } else {
        showNotification('Geolocalização não suportada pelo navegador.', 'warning');
    }
}

// Iniciar rastreamento contínuo
function startContinuousTracking() {
    if ('geolocation' in navigator && watchId === null) {
        watchId = navigator.geolocation.watchPosition(
            function(position) {
                currentPosition = position;
                const { latitude, longitude, accuracy } = position.coords;
                
                // Atualizar o marcador no mapa em tempo real
                if (window.updateDriverLocation) {
                    window.updateDriverLocation(latitude, longitude);
                }
                
                // Atualizar informações de posição
                updatePositionInfo(latitude, longitude);
                
                // Enviar para servidor
                sendLocationToServer(latitude, longitude, accuracy);
                
                isTracking = true;
            },
            function(error) {
                handleGeolocationError(error);
                isTracking = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

// Parar rastreamento
function stopTracking() {
    console.log('⏹️ Parando rastreamento...');
    
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    isTracking = false;
    
    // Atualizar UI
    const positionInfo = document.getElementById('positionInfo');
    if (positionInfo) {
        positionInfo.innerHTML = '<strong>Status:</strong> <span style="color: red;">● Offline</span>';
    }
    
    console.log('✅ Rastreamento parado');
}

// Manipular erro de geolocalização
function handleGeolocationError(error) {
    let errorMessage = 'Erro desconhecido';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Por favor, habilite a localização nas configurações do navegador.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível. Verifique sua conexão com a internet.';
            break;
        case error.TIMEOUT:
            errorMessage = 'Tempo limite excedido ao obter localização.';
            break;
    }
    
    console.error('❌ Erro de geolocalização:', errorMessage);
    showNotification(errorMessage, 'warning');
    
    // Se estava online, forçar modo offline
    if (isOnline) {
        const toggleOnlineBtn = document.getElementById('toggleOnline');
        if (toggleOnlineBtn) {
            isOnline = false;
            updateOnlineStatusUI();
            sessionStorage.setItem('trackingStatus', 'offline');
        }
    }
}

// Parar todos os intervals
function stopAllIntervals() {
    console.log('🛑 Parando todos os intervals...');
    
    const highestIntervalId = setInterval(() => {}, 9999);
    for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
    }
    
    stopOnlineTimeTracking();
}

// Enviar localização para o servidor
function sendLocationToServer(lat, lng, accuracy) {
    const driverId = sessionStorage.getItem('currentDriver');
    
    if (!driverId) return;
    
    const locationData = {
        driverId: driverId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy,
        timestamp: new Date().toISOString(),
        car: sessionStorage.getItem('driverCar'),
        status: 'online'
    };
    
    // Simulação de envio para o servidor
    console.log('📤 Dados de localização:', locationData);
    
    // Em uma implementação real, usar fetch()
    simulateServerUpdate(locationData);
}

// Simular atualização do servidor
function simulateServerUpdate(data) {
    // Simular latência de rede
    setTimeout(() => {
        console.log('✅ Localização enviada para o servidor (simulado)');
    }, 100 + Math.random() * 200);
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        font-weight: 500;
    `;
    
    // Cores baseadas no tipo
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.style.color = 'white';
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Adicionar estilos para notificações
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification button:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(notificationStyles);

// Gerenciar evento beforeunload
window.addEventListener('beforeunload', function(e) {
    if (isTracking) {
        const message = 'Você está transmitindo sua localização. Tem certeza que deseja sair?';
        e.returnValue = message;
        return message;
    }
});

console.log('✅ Sistema de autenticação carregado com sucesso');

// Exportar funções globais
window.goOnline = goOnline;
window.goOffline = goOffline;
window.handleLogout = handleLogout;