// Sistema de autenticação

// Configuração dos motoristas (deve ser acessível em todos os arquivos)
const drivers = {
    "Mega": {
        password: "12345",
        phone: "351939354112",
        activeHours: [13, 21],
        car: "Logan 62-QM-79"
    },
    "Heitor": {
        password: "12345",
        phone: "351910603136",
        activeHours: [5, 13],
        car: "Logan 62-QM-79"
    },
    "Xavier": {
        password: "12345",
        phone: "351967029637",
        activeHours: [21, 29],
        car: "Logan 62-QM-79"
    }
};

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

// Tornar funções disponíveis globalmente
window.authenticate = authenticate;
window.isDriverActive = isDriverActive;

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (authenticate(username, password)) {
                sessionStorage.setItem('currentDriver', username);
                sessionStorage.setItem('driverCar', drivers[username].car);
                sessionStorage.setItem('driverPhone', drivers[username].phone);
                
                window.location.href = 'motorista.html';
            } else {
                const errorMsg = document.getElementById('errorMsg');
                errorMsg.textContent = 'Usuário ou senha incorretos!';
                errorMsg.style.display = 'block';
            }
        });
    }
    
    // Verificar se o usuário está logado na área do motorista
    if (window.location.pathname.includes('motorista.html')) {
        const currentDriver = sessionStorage.getItem('currentDriver');
        
        if (!currentDriver || !drivers[currentDriver]) {
            window.location.href = 'login.html';
            return;
        }
        
        // Preencher informações do motorista
        document.getElementById('driverName').textContent = currentDriver;
        document.getElementById('driverPhone').textContent = sessionStorage.getItem('driverPhone');
        document.getElementById('driverCar').textContent = sessionStorage.getItem('driverCar');
        
        // Configurar botão de logout
        document.getElementById('btnLogout').addEventListener('click', function() {
            sessionStorage.removeItem('currentDriver');
            sessionStorage.removeItem('driverCar');
            sessionStorage.removeItem('driverPhone');
            window.location.href = 'index.html';
        });
        
        // Configurar botão de online/offline
        const toggleOnlineBtn = document.getElementById('toggleOnline');
        const startTrackingBtn = document.getElementById('startTracking');
        
        let isOnline = false;
        
        toggleOnlineBtn.addEventListener('click', function() {
            isOnline = !isOnline;
            
            if (isOnline) {
                toggleOnlineBtn.textContent = 'Ficar Offline';
                toggleOnlineBtn.style.backgroundColor = '#ccc';
                toggleOnlineBtn.style.color = '#333';
                startTrackingBtn.disabled = false;
                document.getElementById('driverStatus').textContent = 'Online';
                document.getElementById('driverStatus').style.color = 'green';
                
                startTracking();
            } else {
                toggleOnlineBtn.textContent = 'Ficar Online';
                toggleOnlineBtn.style.backgroundColor = '#ffd700';
                toggleOnlineBtn.style.color = '#333';
                startTrackingBtn.disabled = true;
                document.getElementById('driverStatus').textContent = 'Offline';
                document.getElementById('driverStatus').style.color = 'red';
                
                stopTracking();
            }
        });
        
        startTrackingBtn.addEventListener('click', function() {
            alert('Rastreamento iniciado! Sua localização será compartilhada em tempo real.');
        });
    }
});

// Simulação de rastreamento de localização
let watchId = null;

function startTracking() {
    if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
            function(position) {
                const { latitude, longitude } = position.coords;
                console.log('Localização:', latitude, longitude);
                
                if (window.driverMarker) {
                    const newPosition = { lat: latitude, lng: longitude };
                    window.driverMarker.setPosition(newPosition);
                    
                    // Atualizar o centro do mapa para a nova posição
                    if (window.map) {
                        window.map.setCenter(newPosition);
                    }
                    
                    // Animação de movimento
                    window.driverMarker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(() => {
                        window.driverMarker.setAnimation(null);
                    }, 1500);
                }
                
                // Aqui você enviaria a localização para o servidor em tempo real
                // sendLocationToServer(latitude, longitude);
            },
            function(error) {
                console.error('Erro ao obter localização:', error);
            },
            { 
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocalização não é suportada pelo seu navegador.');
    }
}

function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}