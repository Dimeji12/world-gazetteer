$(document).ready(function() {
    // Initialize map
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marker clusters
    const citiesCluster = L.markerClusterGroup();
    const airportsCluster = L.markerClusterGroup();
    const landmarksCluster = L.markerClusterGroup();

    // Load country list
    $.get('php/getCountries.php', function(data) {
        data.forEach(country => {
            $('#countrySelect').append(`<option value="${country.code}">${country.name}</option>`);
        });
    });

    // Country select handler
    $('#countrySelect').change(function() {
        const countryCode = $(this).val();
        if (!countryCode) return;
        loadCountryData(countryCode);
    });

    // Locate button handler
    $('#locateBtn').click(function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 6);
                    
                    // Reverse geocode to get country
                    $.get('php/apis/geonames.php', { 
                        lat: latitude, 
                        lng: longitude,
                        featureCode: 'PCLI' // Country-level feature
                    }, function(data) {
                        if (data.length > 0) {
                            $('#countrySelect').val(data[0].countryCode).trigger('change');
                        }
                    });
                },
                error => {
                    alert('Unable to retrieve your location');
                }
            );
        } else {
            alert('Geolocation not supported');
        }
    });

    // Demographics modal
    $('#demographicsBtn').click(function() {
        const countryCode = $('#countrySelect').val();
        if (!countryCode) return alert('Select a country first');
        
        showLoading();
        $.get('php/apis/countryInfo.php', { code: countryCode }, function(data) {
            $('#modalTitle').text(data.name);
            $('#modalContent').html(`
                <div class="row">
                    <div class="col-md-6">
                        <h4>Basic Info</h4>
                        <p><strong>Capital:</strong> ${data.capital}</p>
                        <p><strong>Population:</strong> ${data.population.toLocaleString()}</p>
                        <p><strong>Area:</strong> ${data.area.toLocaleString()} km²</p>
                        <p><strong>Languages:</strong> ${data.languages}</p>
                        <p><strong>Currency:</strong> ${data.currency}</p>
                    </div>
                    <div class="col-md-6 text-center">
                        <img src="${data.flag}" alt="Flag" class="img-fluid mb-3">
                    </div>
                </div>
            `);
            $('#infoModal').modal('show');
        }).always(hideLoading);
    });

    // Weather modal
    $('#weatherBtn').click(function() {
        const countryCode = $('#countrySelect').val();
        if (!countryCode) return alert('Select a country first');
        
        showLoading();
        $.get('php/apis/countryInfo.php', { code: countryCode }, function(info) {
            return $.get('php/apis/weather.php', { 
                lat: info.latlng[0], 
                lng: info.latlng[1] 
            });
        }).then(function(weatherData) {
            $('#modalTitle').text(`Weather in ${weatherData.name}`);
            $('#modalContent').html(`
                <div class="text-center">
                    <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png">
                    <h2>${Math.round(weatherData.main.temp)}°C</h2>
                    <p>${weatherData.weather[0].description}</p>
                    <div class="row">
                        <div class="col-md-6">
                            <p>Humidity: ${weatherData.main.humidity}%</p>
                            <p>Pressure: ${weatherData.main.pressure} hPa</p>
                        </div>
                        <div class="col-md-6">
                            <p>Wind: ${weatherData.wind.speed} m/s</p>
                            <p>Visibility: ${weatherData.visibility/1000} km</p>
                        </div>
                    </div>
                </div>
            `);
            $('#infoModal').modal('show');
        }).always(hideLoading);
    });

    // Helper functions
    function loadCountryData(countryCode) {
        showLoading();
        
        // Clear existing layers
        map.eachLayer(layer => {
            if (layer instanceof L.GeoJSON || layer instanceof L.MarkerClusterGroup) {
                map.removeLayer(layer);
            }
        });

        // Load country border
        $.get('php/getBorder.php', { code: countryCode }, function(data) {
            const countryLayer = L.geoJSON(data, {
                style: {
                    color: '#3388ff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.1
                }
            }).addTo(map);
            
            map.fitBounds(countryLayer.getBounds());

            // Load cities and airports
            loadPointsOfInterest(countryCode);
        }).always(hideLoading);
    }

    function loadPointsOfInterest(countryCode) {
        // Load cities
        $.get('php/apis/geonames.php', { 
            country: countryCode,
            featureCode: 'PPL',
            maxRows: 30
        }, function(cities) {
            cities.forEach(city => {
                const marker = L.marker([city.lat, city.lng])
                    .bindPopup(`<b>${city.name}</b><br>Population: ${city.population}`);
                citiesCluster.addLayer(marker);
            });
            map.addLayer(citiesCluster);
        });

        // Load airports
        $.get('php/apis/geonames.php', { 
            country: countryCode,
            featureCode: 'AIRP',
            maxRows: 15
        }, function(airports) {
            airports.forEach(airport => {
                const marker = L.marker([airport.lat, airport.lng], {
                    icon: L.icon({
                        iconUrl: 'assets/airport-icon.png',
                        iconSize: [30, 30]
                    })
                }).bindPopup(`<b>${airport.name}</b>`);
                airportsCluster.addLayer(marker);
            });
            map.addLayer(airportsCluster);
        });
    }

    function showLoading() {
        $('#loadingOverlay').show();
    }

    function hideLoading() {
        $('#loadingOverlay').hide();
    }
});