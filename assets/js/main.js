$(document).ready(function() {
    // Initialize loading state
    let activeRequests = 0;

    // Improved loading functions
    function showLoading() {
        activeRequests++;
        $('#loadingOverlay').show();
    }

    function hideLoading() {
        activeRequests--;
        if (activeRequests <= 0) {
            $('#loadingOverlay').hide();
            activeRequests = 0;
        }
    }

    // Initialize map
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marker clusters
    const citiesCluster = L.markerClusterGroup();
    const airportsCluster = L.markerClusterGroup();

    // Load country list
    function loadCountries() {
        showLoading();
        $.get('php/getCountries.php')
            .done(function(data) {
                $('#countrySelect').empty().append('<option value="">Select a country</option>');
                data.forEach(country => {
                    $('#countrySelect').append(`<option value="${country.code}">${country.name}</option>`);
                });
            })
            .fail(function() {
                console.error("Failed to load countries");
            })
            .always(hideLoading);
    }

    // Country select handler
    $('#countrySelect').change(function() {
        const countryCode = $(this).val();
        if (!countryCode) return;
        loadCountryData(countryCode);
    });

    // Locate button handler
    $('#locateBtn').click(function() {
        showLoading();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 6);
                    
                    $.get('php/apis/geonames.php', { 
                        lat: latitude, 
                        lng: longitude,
                        featureCode: 'PCLI'
                    }).done(function(data) {
                        if (data.length > 0) {
                            $('#countrySelect').val(data[0].countryCode).trigger('change');
                        }
                    }).always(hideLoading);
                },
                error => {
                    hideLoading();
                    alert('Unable to retrieve your location: ' + error.message);
                }
            );
        } else {
            hideLoading();
            alert('Geolocation not supported by your browser');
        }
    });

    // Modal handler
    $('#demographicsBtn').click(function() {
        const countryCode = $('#countrySelect').val();
        if (!countryCode) return alert('Please select a country first');
        
        showLoading();
        $.get('php/apis/countryInfo.php', { code: countryCode })
            .done(function(data) {
                $('#modalTitle').text(data.name);
                $('#modalContent').html(`
                    <div class="row">
                        <div class="col-md-6">
                            <h4>Basic Info</h4>
                            <p><strong>Capital:</strong> ${data.capital || 'N/A'}</p>
                            <p><strong>Population:</strong> ${data.population ? data.population.toLocaleString() : 'N/A'}</p>
                            <p><strong>Area:</strong> ${data.area ? data.area.toLocaleString() + ' km²' : 'N/A'}</p>
                            <p><strong>Languages:</strong> ${data.languages || 'N/A'}</p>
                            <p><strong>Currency:</strong> ${data.currency || 'N/A'}</p>
                        </div>
                        <div class="col-md-6 text-center">
                            ${data.flag ? `<img src="${data.flag}" alt="Flag" class="img-fluid mb-3">` : ''}
                        </div>
                    </div>
                `);
                $('#infoModal').modal('show');
            })
            .fail(function() {
                alert('Failed to load country data');
            })
            .always(hideLoading);
    });

    // Load country data
    function loadCountryData(countryCode) {
        showLoading();
        
        // Clear existing layers
        map.eachLayer(layer => {
            if (layer instanceof L.GeoJSON || layer instanceof L.MarkerClusterGroup) {
                map.removeLayer(layer);
            }
        });

        citiesCluster.clearLayers();
        airportsCluster.clearLayers();

        // Load country border
        $.get('php/getBorder.php', { code: countryCode })
            .done(function(data) {
                const countryLayer = L.geoJSON(data, {
                    style: {
                        color: '#3388ff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.1
                    }
                }).addTo(map);
                map.fitBounds(countryLayer.getBounds());
            })
            .always(function() {
                loadPointsOfInterest(countryCode);
            });
    }

    // Load points of interest
    function loadPointsOfInterest(countryCode) {
        showLoading();
        
        $.when(
            $.get('php/apis/geonames.php', {
                country: countryCode,
                featureCode: 'PPL',
                maxRows: 30
            }),
            $.get('php/apis/geonames.php', {
                country: countryCode,
                featureCode: 'AIRP',
                maxRows: 15
            })
        ).done(function(citiesResponse, airportsResponse) {
            const cities = citiesResponse[0];
            const airports = airportsResponse[0];
            
            // Add cities
            cities.forEach(city => {
                const marker = L.marker([city.lat, city.lng])
                    .bindPopup(`<b>${city.name}</b><br>Population: ${city.population || 'N/A'}`);
                citiesCluster.addLayer(marker);
            });
            
            // Add airports
            airports.forEach(airport => {
                const marker = L.marker([airport.lat, airport.lng], {
                    icon: L.icon({
                        iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
                        iconSize: [30, 30]
                    })
                }).bindPopup(`<b>${airport.name}</b>`);
                airportsCluster.addLayer(marker);
            });
            
            map.addLayer(citiesCluster);
            map.addLayer(airportsCluster);
        }).fail(function() {
            console.error("Failed to load points of interest");
        }).always(hideLoading);
    }

    // Initialize
    loadCountries();
});