// Configurações do mapa
let map;
let driverMarker;
let autocompleteFrom;
let autocompleteTo;
let watchId = null;
let accuracyCircle = null;

// Inicializar mapa na página inicial
function initMap() {
    // Coordenadas de Lisboa
    const lisbon = { lat: 38.7223, lng: -9.1393 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: lisbon,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    });
    
    // Adicionar controles de zoom
    map.setOptions({
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        rotateControl: true,
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });
    
    // Inicializar autocomplete se estiver na página de formulário
    if (document.getElementById('location') && document.getElementById('destination')) {
        initAutocomplete();
    }
    
    // Tentar centralizar no usuário se a geolocalização estiver disponível
    if ('geolocation' in navigator && !window.location.pathname.includes('motorista.html')) {
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
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new google.maps.Size(32, 32)
                    },
                    animation: google.maps.Animation.DROP
                });
                
                // Adicionar círculo de precisão
                new google.maps.Circle({
                    map: map,
                    center: userLocation,
                    radius: position.coords.accuracy,
                    fillColor: '#4285F4',
                    fillOpacity: 0.2,
                    strokeColor: '#4285F4',
                    strokeOpacity: 0.5,
                    strokeWeight: 1
                });
            },
            function(error) {
                console.log('Geolocalização não permitida ou não disponível');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    }
}

// Inicializar autocomplete
function initAutocomplete() {
    if (google.maps.places) {
        const locationInput = document.getElementById('location');
        const destinationInput = document.getElementById('destination');
        
        // Configurar autocomplete para "Onde você está?"
        autocompleteFrom = new google.maps.places.Autocomplete(locationInput, {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'pt' },
            fields: ['geometry', 'name', 'formatted_address']
        });
        
        // Configurar autocomplete para "Pra onde vai?"
        autocompleteTo = new google.maps.places.Autocomplete(destinationInput, {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'pt' },
            fields: ['geometry', 'name', 'formatted_address']
        });
        
        // Adicionar evento para quando um lugar é selecionado
        autocompleteFrom.addListener('place_changed', function() {
            const place = autocompleteFrom.getPlace();
            if (!place.geometry) {
                console.log('Local não encontrado');
                return;
            }
            
            // Centralizar mapa no local selecionado
            if (map && place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(15);
            }
        });
        
        autocompleteTo.addListener('place_changed', function() {
            const place = autocompleteTo.getPlace();
            if (!place.geometry) {
                console.log('Destino não encontrado');
                return;
            }
            
            // Centralizar mapa no destino selecionado
            if (map && place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(15);
            }
        });
        
        // Evitar submit do formulário ao pressionar Enter no autocomplete
        const preventFormSubmit = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        locationInput.addEventListener('keydown', preventFormSubmit);
        destinationInput.addEventListener('keydown', preventFormSubmit);
        
        // Adicionar botão de localização atual ao input "Onde você está?"
        addCurrentLocationButton(locationInput);
    }
}

// Adicionar botão de localização atual
function addCurrentLocationButton(inputElement) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    inputElement.parentNode.insertBefore(wrapper, inputElement);
    wrapper.appendChild(inputElement);
    
    const locationButton = document.createElement('button');
    locationButton.innerHTML = '📍';
    locationButton.style.position = 'absolute';
    locationButton.style.right = '5px';
    locationButton.style.top = '50%';
    locationButton.style.transform = 'translateY(-50%)';
    locationButton.style.background = 'none';
    locationButton.style.border = 'none';
    locationButton.style.cursor = 'pointer';
    locationButton.style.fontSize = '18px';
    locationButton.title = 'Usar minha localização atual';
    
    locationButton.addEventListener('click', function() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const geocoder = new google.maps.Geocoder();
                    const latLng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    geocoder.geocode({ location: latLng }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            inputElement.value = results[0].formatted_address;
                            
                            // Centralizar mapa na localização
                            if (map) {
                                map.setCenter(latLng);
                                map.setZoom(16);
                                
                                // Adicionar marcador temporário
                                new google.maps.Marker({
                                    position: latLng,
                                    map: map,
                                    title: 'Localização atual',
                                    icon: {
                                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                    },
                                    animation: google.maps.Animation.DROP
                                });
                            }
                        }
                    });
                },
                function(error) {
                    alert('Não foi possível obter sua localização atual.');
                }
            );
        } else {
            alert('Geolocalização não suportada pelo navegador.');
        }
    });
    
    wrapper.appendChild(locationButton);
}

// Inicializar mapa na área do motorista
function initDriverMap() {
    // Coordenadas iniciais de Lisboa
    const lisbon = { lat: 38.7223, lng: -9.1393 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: lisbon,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    });
    
    // Adicionar controles de zoom
    map.setOptions({
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        rotateControl: true,
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
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
        animation: google.maps.Animation.DROP,
        optimized: false
    });
    
    // Tornar o marcador acessível globalmente
    window.driverMarker = driverMarker;
    window.map = map;
    
    // Configurar arrastar o card de informações
    setupDraggableCard();
    
    // Iniciar rastreamento automático
    startInitialTracking();
}

// Configurar card arrastável
function setupDraggableCard() {
    const driverInfo = document.querySelector('.driver-info');
    const dragHandle = document.getElementById('dragHandle');
    
    if (dragHandle && driverInfo) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        dragHandle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        dragHandle.addEventListener('touchstart', startDragTouch);
        document.addEventListener('touchmove', dragTouch);
        document.addEventListener('touchend', stopDrag);
        
        function startDrag(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(driverInfo).left) || 0;
            startTop = parseInt(window.getComputedStyle(driverInfo).top) || 0;
            dragHandle.style.cursor = 'grabbing';
            driverInfo.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            e.preventDefault();
        }
        
        function startDragTouch(e) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startLeft = parseInt(window.getComputedStyle(driverInfo).left) || 0;
            startTop = parseInt(window.getComputedStyle(driverInfo).top) || 0;
            driverInfo.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            e.preventDefault();
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Limitar movimento dentro da tela
            const newLeft = Math.max(0, Math.min(window.innerWidth - driverInfo.offsetWidth, startLeft + dx));
            const newTop = Math.max(0, Math.min(window.innerHeight - driverInfo.offsetHeight, startTop + dy));
            
            driverInfo.style.left = newLeft + 'px';
            driverInfo.style.top = newTop + 'px';
        }
        
        function dragTouch(e) {
            if (!isDragging) return;
            
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            
            const newLeft = Math.max(0, Math.min(window.innerWidth - driverInfo.offsetWidth, startLeft + dx));
            const newTop = Math.max(0, Math.min(window.innerHeight - driverInfo.offsetHeight, startTop + dy));
            
            driverInfo.style.left = newLeft + 'px';
            driverInfo.style.top = newTop + 'px';
            e.preventDefault();
        }
        
        function stopDrag() {
            isDragging = false;
            dragHandle.style.cursor = 'grab';
            driverInfo.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            
            // Salvar posição no localStorage
            localStorage.setItem('driverCardPosition', JSON.stringify({
                left: driverInfo.style.left,
                top: driverInfo.style.top
            }));
        }
        
        // Restaurar posição salva
        const savedPosition = localStorage.getItem('driverCardPosition');
        if (savedPosition) {
            try {
                const position = JSON.parse(savedPosition);
                driverInfo.style.left = position.left || '0px';
                driverInfo.style.top = position.top || '0px';
            } catch (e) {
                console.error('Erro ao restaurar posição:', e);
            }
        }
    }
}

// Iniciar rastreamento inicial
function startInitialTracking() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const driverLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Atualizar posição do marcador
                updateDriverLocation(driverLocation.lat, driverLocation.lng);
                
                // Adicionar círculo de precisão
                if (accuracyCircle) {
                    accuracyCircle.setMap(null);
                }
                
                accuracyCircle = new google.maps.Circle({
                    map: map,
                    center: driverLocation,
                    radius: position.coords.accuracy,
                    fillColor: '#DB4437',
                    fillOpacity: 0.2,
                    strokeColor: '#DB4437',
                    strokeOpacity: 0.5,
                    strokeWeight: 1
                });
                
                console.log('📍 Localização inicial:', driverLocation.lat, driverLocation.lng);
                
            },
            function(error) {
                console.error('Erro ao obter localização inicial:', error);
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
        
        // Atualizar posição do marcador
        driverMarker.setPosition(newPosition);
        
        // Atualizar círculo de precisão se existir
        if (accuracyCircle) {
            accuracyCircle.setCenter(newPosition);
        }
        
        // Manter o mapa centralizado na nova posição (suavemente)
        map.panTo(newPosition);
        
        // Adicionar animação de bounce para indicar movimento
        driverMarker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            driverMarker.setAnimation(null);
        }, 700);
        
        // Atualizar informações de posição (se existirem)
        if (window.updatePositionInfo) {
            window.updatePositionInfo(latitude, longitude);
        }
    }
}

// Função para iniciar rastreamento contínuo
function startContinuousTracking() {
    if ('geolocation' in navigator) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        
        watchId = navigator.geolocation.watchPosition(
            function(position) {
                const { latitude, longitude, accuracy } = position.coords;
                
                // Atualizar o marcador no mapa em tempo real
                updateDriverLocation(latitude, longitude);
                
                // Atualizar círculo de precisão
                if (accuracyCircle) {
                    accuracyCircle.setRadius(accuracy);
                }
                
                console.log('🔄 Posição atualizada:', latitude, longitude, '±' + accuracy + 'm');
            },
            function(error) {
                console.error('❌ Erro no rastreamento contínuo:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

// Função para parar rastreamento
function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        console.log('⏹️ Rastreamento parado');
    }
}

// Função para obter endereço a partir de coordenadas
function getAddressFromCoords(lat, lng, callback) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: lat, lng: lng };
    
    geocoder.geocode({ location: latlng }, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                callback(results[0].formatted_address);
            } else {
                callback('Endereço não encontrado');
            }
        } else {
            callback('Erro ao geocodificar: ' + status);
        }
    });
}

// Inicializar o mapa quando a API do Google Maps carregar
window.initMap = initMap;
window.initDriverMap = initDriverMap;
window.updateDriverLocation = updateDriverLocation;
window.startContinuousTracking = startContinuousTracking;
window.stopTracking = stopTracking;
window.getAddressFromCoords = getAddressFromCoords;

// Adicionar loader para a API do Google Maps
console.log('✅ Google Maps API carregada com sucesso');

// Verificar se a API Places está disponível
if (typeof google !== 'undefined' && google.maps && google.maps.places) {
    console.log('✅ Google Places API disponível');
}