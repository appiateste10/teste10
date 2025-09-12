// Configurações do mapa
let map;
let driverMarker;

// Inicializar mapa na página inicial
function initMap() {
    // Coordenadas de Lisboa
    const lisbon = { lat: 38.7223, lng: -9.1393 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: lisbon,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Adicionar controles de zoom
    map.setOptions({
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
    });
    
    // Tentar centralizar no usuário se a geolocalização estiver disponível
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setCenter(userLocation);
                
                // Adicionar marcador padrão do Google Maps para o usuário
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Sua localização',
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    }
                });
            },
            function(error) {
                console.log('Geolocalização não permitida ou não disponível');
            }
        );
    }
}

// Inicializar mapa na área do motorista
function initDriverMap() {
    // Coordenadas iniciais de Lisboa
    const lisbon = { lat: 38.7223, lng: -9.1393 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15, // Zoom mais próximo para melhor visualização
        center: lisbon,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Adicionar controles de zoom
    map.setOptions({
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
    });
    
    // Criar marcador padrão do Google Maps para o motorista
    driverMarker = new google.maps.Marker({
        position: lisbon,
        map: map,
        title: 'Sua localização',
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        },
        animation: google.maps.Animation.DROP
    });
    
    // Tornar o marcador acessível globalmente
    window.driverMarker = driverMarker;
    window.map = map;
    
    // Centralizar o mapa na localização real do motorista
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const driverLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Atualizar posição do marcador
                driverMarker.setPosition(driverLocation);
                
                // Centralizar o mapa na nova posição com animação
                map.panTo(driverLocation);
                
                // Adicionar círculo de precisão
                const circle = new google.maps.Circle({
                    map: map,
                    center: driverLocation,
                    radius: position.coords.accuracy,
                    fillColor: '#FF0000',
                    fillOpacity: 0.2,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.5,
                    strokeWeight: 1
                });
                
                console.log('Localização do motorista:', driverLocation.lat, driverLocation.lng);
                
            },
            function(error) {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível acessar sua localização. Verifique as permissões do navegador.');
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocalização não é suportada pelo seu navegador.');
    }
}

// Função para atualizar a localização do motorista em tempo real
function updateDriverLocation(latitude, longitude) {
    if (window.driverMarker && window.map) {
        const newPosition = new google.maps.LatLng(latitude, longitude);
        
        // Atualizar posição do marcador com animação
        driverMarker.setPosition(newPosition);
        
        // Suavizar o movimento do mapa
        map.panTo(newPosition);
        
        // Adicionar animação de bounce
        driverMarker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            driverMarker.setAnimation(null);
        }, 1500);
    }
}

// Inicializar o mapa quando a API do Google Maps carregar
window.initMap = initMap;
window.initDriverMap = initDriverMap;
window.updateDriverLocation = updateDriverLocation;