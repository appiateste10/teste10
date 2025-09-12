// Funções comuns para todas as páginas

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
    
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeStr;
    }
}

// Inicializar a atualização de data e hora
if (document.getElementById('currentDateTime')) {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// Gerar botões de WhatsApp para o formulário
function generateWhatsAppButtons() {
    const buttonsContainer = document.getElementById('driverButtons');
    if (!buttonsContainer) return;
    
    buttonsContainer.innerHTML = '';
    
    for (const [name, info] of Object.entries(drivers)) {
        const isActive = isDriverActive(info.activeHours);
        
        const button = document.createElement('button');
        button.className = `driver-button ${isActive ? '' : 'hidden'}`;
        button.textContent = `Enviar para ${name}`;
        button.disabled = !isActive;
        
        if (isActive) {
            button.onclick = function() {
                sendWhatsAppMessage(info.phone, name);
            };
        }
        
        buttonsContainer.appendChild(button);
    }
}

// Enviar mensagem via WhatsApp
function sendWhatsAppMessage(phone, driverName) {
    const form = document.getElementById('taxiForm');
    if (!form) return;
    
    const formData = {
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        destination: document.getElementById('destination').value,
        passengers: document.getElementById('passengers').value,
        contact: document.getElementById('contact').value,
        eta: document.getElementById('eta').value,
        payment: document.getElementById('payment').value,
        notes: document.getElementById('notes').value
    };
    
    // Validar formulário
    for (const key in formData) {
        if (formData[key] === '' && key !== 'notes') {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
    }
    
    // Criar mensagem
    const message = `*Solicitação de Táxi - LisboaGo*%0A%0A` +
                    `*Nome:* ${formData.name}%0A` +
                    `*Localização:* ${formData.location}%0A` +
                    `*Destino:* ${formData.destination}%0A` +
                    `*Passageiros:* ${formData.passengers}%0A` +
                    `*Contato:* ${formData.contact}%0A` +
                    `*Tempo de Chegada:* ${formData.eta}%0A` +
                    `*Pagamento:* ${formData.payment}%0A` +
                    `*Observações:* ${formData.notes || 'Nenhuma'}`;
    
    // Abrir WhatsApp
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

// Inicializar botões do WhatsApp se estiver na página de formulário
if (window.location.pathname.includes('formulario.html') || 
    (window.location.pathname === '' && window.location.hash === '#formulario')) {
    window.onload = generateWhatsAppButtons;
}

// Carregar Google Maps API corretamente
function loadGoogleMaps() {
    if (!document.querySelector('script[src*="googleapis"]')) {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBmc6HTJo70N_ueR1qFVgyu74v7FIl7dU4&callback=initMap';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
}

// Carregar Google Maps para área do motorista
function loadDriverMap() {
    if (!document.querySelector('script[src*="googleapis"]')) {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBmc6HTJo70N_ueR1qFVgyu74v7FIl7dU4&callback=initDriverMap';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Página inicial
    if (document.getElementById('map') && !window.location.pathname.includes('motorista.html')) {
        loadGoogleMaps();
    }
    
    // Área do motorista
    if (window.location.pathname.includes('motorista.html')) {
        loadDriverMap();
    }
});

// Função para mostrar localização atual do usuário
function showCurrentLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                if (window.map) {
                    window.map.setCenter(userLocation);
                    
                    // Adicionar marcador temporário
                    new google.maps.Marker({
                        position: userLocation,
                        map: window.map,
                        title: 'Sua localização atual',
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                        },
                        animation: google.maps.Animation.DROP
                    });
                }
            },
            function(error) {
                alert('Não foi possível obter sua localização atual.');
            }
        );
    } else {
        alert('Geolocalização não suportada pelo navegador.');
    }
}

// Tornar funções globais
window.showCurrentLocation = showCurrentLocation;