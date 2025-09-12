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
}

// Inicializar mapa na área do motorista
function initDriverMap() {
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
    
    // Ícone personalizado para o táxi (carro amarelo com detalhes em preto)
    const taxiIcon = {
        url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSIjMDAwMDAwIj48cGF0aCBmaWxsPSIjZmZkNzAwIiBkPSJNMTI1LjcgMTg0LjVjLTEzLjggMC0yNS0xMS4yLTI1LTI1czExLjItMjUgMjUtMjUgMjUgMTEuMiAyNSAyNS0xMS4yIDI1LTI1IDI1em0yNjAuNiAwYy0xMy44IDAtMjUtMTEuMi0yNS0yNXMxMS4yLTI1IDI1LTI1IDI1IDExLjIgMjUgMjUtMTEuMiAyNS0yNSAyNXpNNDA2LjUgMTYwSDM1MHYtNDBjMC02LjYtNS40LTEyLTEyLTEySDE3NGMtNi42IDAtMTIgNS40LTEyIDEydjQwSDEwNS41Yy01LjggMC0xMC41IDQuNy0xMC41IDEwLjV2MjI5YzAgNS44IDQuNyAxMC41IDEwLjUgMTAuNWgzMDFjNS44IDAgMTAuNS00LjcgMTAuNS0xMC41di0yMjljMC01LjgtNC43LTEwLjUtMTAuNS0xMC41ek0xOTQgMTQwaDEyNHY0MEgxOTR2LTQwem0yMjQgMjA2LjVjMCA1LjItNC4zIDkuNS05LjUgOS41aC0yOTFjLTUuMiAwLTkuNS00LjMtOS41LTkuNXY0OWMwIDUuMiA0LjMgOS41IDkuNSA5LjVoMjkxYzUuMiAwIDkuNS00LjMgOS41LTkuNXYtNDl6bTAtNjljMCA1LjItNC4zIDkuNS05LjUgOS41aC0yOTFjLTUuMiAwLTkuNS00LjMtOS41LTkuNXYtMjljMC01LjIgNC4zLTkuNSA5LjUtOS41aDI5MWM1LjIgMCA5LjUgNC4zIDkuNSA5LjV2Mjl6Ii8+PC9zdmc+',
        scaledSize: new google.maps.Size(45, 45),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(22, 22)
    };
    
    // Criar marcador para o motorista
    driverMarker = new google.maps.Marker({
        position: lisbon,
        map: map,
        icon: taxiIcon,
        title: 'Sua localização',
        optimized: false // Para melhor performance com ícones personalizados
    });
    
    // Tornar o marcador acessível globalmente
    window.driverMarker = driverMarker;
    window.map = map;
    
    // Centralizar o mapa na localização do motorista, se disponível
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const driverLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setCenter(driverLocation);
                driverMarker.setPosition(driverLocation);
                
                // Adicionar animação de pulso ao marcador
                setInterval(() => {
                    driverMarker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(() => {
                        driverMarker.setAnimation(null);
                    }, 750);
                }, 3000);
            },
            function(error) {
                console.error('Erro ao obter localização:', error);
                // Manter animação mesmo sem geolocalização
                setInterval(() => {
                    driverMarker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(() => {
                        driverMarker.setAnimation(null);
                    }, 750);
                }, 3000);
            }
        );
    } else {
        // Animação para quando a geolocalização não é suportada
        setInterval(() => {
            driverMarker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                driverMarker.setAnimation(null);
            }, 750);
        }, 3000);
    }
}

// Inicializar o mapa quando a API do Google Maps carregar
window.initMap = initMap;