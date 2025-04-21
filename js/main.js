$(document).ready(function ()
{
    // Initialize variables
    let activeRequests = 0;
    let currentCountryData = null;
    let currentMapLayer = null;
    let map = null;
    let currentLocationMarker = null;

    // Marker groups
    const markerGroups = {
        cities: L.markerClusterGroup({ maxClusterRadius: 80 }),
        airports: L.markerClusterGroup({ disableClusteringAtZoom: 10 }),
        wiki: L.markerClusterGroup({ spiderfyOnMaxZoom: true })
    };

    // Map providers
    const mapProviders = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }),
        google: L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '© Google Maps'
        }),
        esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        })
    };

    // ======================
    // UTILITY FUNCTIONS
    // ======================

    function showLoading(message = "Loading...")
    {
        activeRequests++;
        $('#loadingOverlay').show().find('div:last').text(message);
        console.log(`Loading: ${message}`);
    }

    function hideLoading()
    {
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests <= 0)
        {
            $('#loadingOverlay').hide();
        }
        console.log(`Active requests: ${activeRequests}`);
    }

    function showErrorModal(title, message)
    {
        console.error(`${title}: ${message}`);
        $('#modalTitle').text(title);
        $('#modalContent').html(`
            <div class="alert alert-danger">
                <h4>${title}</h4>
                <p>${message}</p>
                <p>Please try again later.</p>
            </div>
        `);
        $('#infoModal').modal('show');
    }

    function showModal(title, content)
    {
        console.log(`Showing modal: ${title}`);
        $('#modalTitle').text(title);
        $('#modalContent').html(content);
        $('#infoModal').modal('show');
    }

    function clearAllMarkers()
    {
        Object.values(markerGroups).forEach(group => group.clearLayers());
        console.log("All markers cleared");
    }

    function updateMarkersVisibility()
    {
        $('#showCities').is(':checked')
            ? map.addLayer(markerGroups.cities)
            : map.removeLayer(markerGroups.cities);

        $('#showAirports').is(':checked')
            ? map.addLayer(markerGroups.airports)
            : map.removeLayer(markerGroups.airports);

        $('#showWiki').is(':checked')
            ? map.addLayer(markerGroups.wiki)
            : map.removeLayer(markerGroups.wiki);
    }

    function resetMapView()
    {
        map.setView([20, 0], 2);
        clearAllMarkers();
        currentCountryData = null;
        console.log("Map view reset");
    }

    // ======================
    // MAP FUNCTIONS
    // ======================

    function initializeMap()
    {
        map = L.map('map', {
            zoomControl: false,
            preferCanvas: true
        }).setView([20, 0], 2);

        L.control.zoom({ position: 'topright' }).addTo(map);
        currentMapLayer = mapProviders.osm.addTo(map);

        Object.values(markerGroups).forEach(group => map.addLayer(group));

        L.control.layers(mapProviders, {
            "Cities": markerGroups.cities,
            "Airports": markerGroups.airports,
            "Wikipedia": markerGroups.wiki
        }, { collapsed: false }).addTo(map);

        console.log("Map initialized");
    }

    function changeMapProvider(provider)
    {
        if (currentMapLayer)
        {
            map.removeLayer(currentMapLayer);
        }
        currentMapLayer = mapProviders[provider].addTo(map);
        $('.map-type-btn').removeClass('active');
        $(`.map-type-btn[data-type="${provider}"]`).addClass('active');
        console.log(`Map provider changed to: ${provider}`);
    }

    function updateMapWithCountry(countryData)
    {
        if (countryData.latlng?.length === 2)
        {
            map.setView(countryData.latlng, 6);
            L.marker(countryData.latlng, {
                icon: L.divIcon({
                    className: 'city-marker',
                    html: '<div></div>',
                    iconSize: [12, 12]
                })
            })
                .addTo(map)
                .bindPopup(`<b>${countryData.name}</b><br>Capital: ${countryData.capital}`);
        }
    }

    // ======================
    // COUNTRY FUNCTIONS
    // ======================

    function loadCountries()
    {
        showLoading("Loading countries...");

        $.ajax({
            url: 'php/getCountries.php',
            dataType: 'json',
            success: function (data)
            {
                if (Array.isArray(data))
                {
                    populateCountrySelect(data);
                } else
                {
                    handleCountryError(data?.error || "Invalid response format");
                }
            },
            error: function (xhr, status, error)
            {
                handleCountryError(`Failed to load countries: ${error}`);
                console.error("Countries load error:", xhr.responseText);
            },
            complete: hideLoading
        });
    }

    function populateCountrySelect(countries)
    {
        const $select = $('#countrySelect').empty().append('<option value="">Select a country</option>');

        countries.forEach(country =>
        {
            $select.append(`<option value="${country.code}">${country.name}</option>`);
        });

        $select.prop('disabled', false);
        console.log(`Loaded ${countries.length} countries`);
        detectUserCountry();
    }

    function detectUserCountry()
    {
        showLoading("Detecting your country...");

        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data =>
            {
                if (data.country_code)
                {
                    $('#countrySelect').val(data.country_code).trigger('change');
                    console.log(`Detected country: ${data.country_code}`);
                }
            })
            .catch(error =>
            {
                console.error("Country detection failed:", error);
            })
            .finally(hideLoading);
    }

    function handleCountryError(message)
    {
        console.error("Country loading failed:", message);
        $('#countrySelect')
            .empty()
            .append('<option value="">Failed to load countries</option>')
            .prop('disabled', true);
        showErrorModal("Data Loading Error", message);
    }

    function loadCountryData(countryCode)
    {
        showLoading(`Loading data for ${countryCode}`);
        clearAllMarkers();

        $.get(`php/getCountryDetails.php?code=${countryCode}`)
            .done(function (data)
            {
                if (data.error) throw new Error(data.error);

                currentCountryData = data;
                console.log("Country data loaded:", data);
                updateMapWithCountry(data);

                // Load country border if available
                $.get(`php/getCountryBorder.php?code=${countryCode}`)
                    .done(borderData =>
                    {
                        if (borderData?.geometry)
                        {
                            L.geoJSON(borderData, {
                                style: {
                                    color: '#3388ff',
                                    weight: 2,
                                    fillOpacity: 0.1
                                }
                            }).addTo(map);
                            console.log("Country border loaded");
                        }
                    })
                    .fail(error => console.error("Border load error:", error));

                loadCountryMarkers(countryCode);
            })
            .fail(function (xhr, status, error)
            {
                console.error("Country details error:", xhr.responseText);
                showErrorModal("Load Error", `Failed to load country data: ${error}`);
            })
            .always(hideLoading);
    }

    function loadCountryMarkers(countryCode) {
        showLoading(`Loading markers for ${countryCode}`);
        
        // Clear existing markers
        markerGroups.cities.clearLayers();
        markerGroups.airports.clearLayers();
        markerGroups.wiki.clearLayers();
    
        const loadPromises = [];
        
        // Only try to load what's checked
        if ($('#showCities').is(':checked')) {
            loadPromises.push(
                $.get(`php/getCities.php?country=${countryCode}`)
                    .done(data => {
                        if (Array.isArray(data) && !data.error) {
                            data.forEach(city => {
                                const marker = L.marker([city.lat, city.lng], {
                                    icon: L.divIcon({
                                        className: 'city-marker',
                                        html: '<div></div>',
                                        iconSize: [12, 12]
                                    })
                                }).bindPopup(`<b>${city.name}</b><br>Population: ${city.population || 'N/A'}`);
                                markerGroups.cities.addLayer(marker);
                            });
                        }
                    })
                    .fail(() => console.log("Cities loading skipped or failed"))
            );
        }
    
        if ($('#showAirports').is(':checked')) {
            loadPromises.push(
                $.get(`php/getAirports.php?country=${countryCode}`)
                    .done(data => {
                        if (Array.isArray(data) && !data.error) {
                            data.forEach(airport => {
                                const marker = L.marker([airport.lat, airport.lng], {
                                    icon: L.divIcon({
                                        className: 'airport-marker',
                                        html: '<div></div>',
                                        iconSize: [12, 12]
                                    })
                                }).bindPopup(`<b>${airport.name}</b><br>Code: ${airport.code || 'N/A'}`);
                                markerGroups.airports.addLayer(marker);
                            });
                        }
                    })
                    .fail(() => console.log("Airports loading skipped or failed"))
            );
        }
    
        if ($('#showWiki').is(':checked')) {
            loadPromises.push(
                $.get(`php/getWikiPoints.php?country=${countryCode}`)
                    .done(data => {
                        if (Array.isArray(data) && !data.error) {
                            data.forEach(point => {
                                const marker = L.marker([point.lat, point.lng], {
                                    icon: L.divIcon({
                                        className: 'wiki-marker',
                                        html: '<div></div>',
                                        iconSize: [12, 12]
                                    })
                                }).bindPopup(`<b>${point.title}</b><br><a href="${point.url}" target="_blank">Read more</a>`);
                                markerGroups.wiki.addLayer(marker);
                            });
                        }
                    })
                    .fail(() => console.log("Wiki points loading skipped or failed"))
            );
        }
    
        // Handle all promises
        Promise.allSettled(loadPromises)
            .then(() => {
                map.invalidateSize();
            })
            .finally(() => {
                hideLoading();
            });
    }

    // ======================
    // INFO MODAL FUNCTIONS
    // ======================

    function showDemographics()
    {
        if (!currentCountryData) return;

        showModal('Demographics', `
            <div class="row">
                <div class="col-md-6">
                    <h4>${currentCountryData.name}</h4>
                    <p><strong>Capital:</strong> ${currentCountryData.capital}</p>
                    <p><strong>Population:</strong> ${currentCountryData.population?.toLocaleString() || 'N/A'}</p>
                    <p><strong>Area:</strong> ${currentCountryData.area?.toLocaleString() + ' km²' || 'N/A'}</p>
                    <p><strong>Languages:</strong> ${currentCountryData.languages || 'N/A'}</p>
                    <p><strong>Currency:</strong> ${currentCountryData.currency || 'N/A'}</p>
                </div>
                <div class="col-md-6 text-center">
                    ${currentCountryData.flag ? `
                        <img src="${currentCountryData.flag}" alt="Flag" class="img-fluid mt-3 shadow" style="max-height:150px;">
                    ` : ''}
                </div>
            </div>
        `);
    }

    function showWeather()
    {
        if (!currentCountryData?.latlng) return;
        showLoading();
        const [lat, lng] = currentCountryData.latlng;

        $.get(`php/getWeather.php?lat=${lat}&lng=${lng}`)
            .done(function (weatherData)
            {
                if (weatherData.cod && weatherData.cod !== 200)
                {
                    throw new Error(weatherData.message || "Weather API error");
                }

                const weather = weatherData.weather[0];
                showModal('Weather', `
                    <div class="row">
                        <div class="col-md-6">
                            <h4>Weather in ${currentCountryData.name}</h4>
                            <p><strong>Temperature:</strong> ${weatherData.main.temp}°C</p>
                            <p><strong>Feels Like:</strong> ${weatherData.main.feels_like}°C</p>
                            <p><strong>Conditions:</strong> ${weather.description}</p>
                            <p><strong>Humidity:</strong> ${weatherData.main.humidity}%</p>
                            <p><strong>Wind:</strong> ${weatherData.wind.speed} m/s</p>
                        </div>
                        <div class="col-md-6 text-center">
                            <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" 
                                 alt="${weather.description}" class="img-fluid">
                            <p class="text-capitalize mt-2">${weather.description}</p>
                        </div>
                    </div>
                `);
            })
            .fail(function (error)
            {
                console.error("Weather load error:", error);
                showErrorModal("Weather Error", "Failed to load weather data");
            })
            .always(hideLoading);
    }

    function showWikipedia()
    {
        if (!currentCountryData) return;
        showLoading();

        $.get(`php/getWikipedia.php?country=${encodeURIComponent(currentCountryData.name)}`)
            .done(function (wikiData)
            {
                if (wikiData.error) throw new Error(wikiData.error);

                showModal('Wikipedia', `
                    <div class="d-flex">
                        <div class="flex-grow-1">
                            <h4>${wikiData.title}</h4>
                            <p>${wikiData.extract}</p>
                        </div>
                        ${wikiData.thumbnail ? `
                            <img src="${wikiData.thumbnail}" class="img-fluid ms-3 mb-3" 
                                 style="max-width:200px; align-self: flex-start;">
                        ` : ''}
                    </div>
                    <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(wikiData.title)}" 
                       target="_blank" class="btn btn-outline-primary mt-2">
                        Read more on Wikipedia
                    </a>
                `);
            })
            .fail(function (error)
            {
                console.error("Wikipedia load error:", error);
                showErrorModal("Wikipedia Error", "Failed to load Wikipedia data");
            })
            .always(hideLoading);
    }

    function showHolidays()
    {
        if (!currentCountryData?.code) return;
        showLoading();

        $.get(`php/getHolidays.php?country=${currentCountryData.code}`)
            .done(function (data)
            {
                if (!Array.isArray(data)) throw new Error("Invalid holidays data");

                let content = `<h4 class="mb-3">Public Holidays</h4><div class="table-responsive"><table class="table">`;
                content += `<thead><tr><th>Date</th><th>Holiday</th><th>Type</th></tr></thead><tbody>`;

                data.slice(0, 10).forEach(holiday =>
                {
                    const date = new Date(holiday.date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });
                    content += `
                        <tr>
                            <td>${date}</td>
                            <td>${holiday.name}</td>
                            <td>${holiday.public ? '<span class="badge bg-success">Public</span>' : ''}</td>
                        </tr>
                    `;
                });

                content += `</tbody></table></div>`;
                showModal('Public Holidays', content);
            })
            .fail(function (error)
            {
                console.error("Holidays load error:", error);
                showErrorModal("Holidays Error", "Failed to load holidays data");
            })
            .always(hideLoading);
    }

    function showLandmarks()
    {
        if (!currentCountryData?.code) return;
        showLoading();

        $.get(`php/getLandmarks.php?country=${currentCountryData.code}`)
            .done(function (data)
            {
                if (!Array.isArray(data)) throw new Error("Invalid landmarks data");

                markerGroups.cities.clearLayers();
                let content = `<h4 class="mb-3">Major Landmarks</h4><div class="row">`;

                data.slice(0, 10).forEach(landmark =>
                {
                    content += `
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">${landmark.name}</h5>
                                    <p class="card-text">
                                        <small>Coordinates: ${landmark.lat}, ${landmark.lng}</small>
                                        ${landmark.population ? `<br><small>Population: ${landmark.population}</small>` : ''}
                                    </p>
                                    <button class="btn btn-sm btn-primary view-on-map" 
                                            data-lat="${landmark.lat}" 
                                            data-lng="${landmark.lng}">
                                        View on Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                    L.marker([landmark.lat, landmark.lng], {
                        icon: L.divIcon({
                            className: 'city-marker',
                            html: '<div></div>',
                            iconSize: [12, 12]
                        })
                    })
                        .bindPopup(`<b>${landmark.name}</b>`)
                        .addTo(markerGroups.cities);
                });

                content += `</div>`;
                showModal('Landmarks', content);

                $('.view-on-map').click(function ()
                {
                    const lat = $(this).data('lat');
                    const lng = $(this).data('lng');
                    map.setView([lat, lng], 8);
                    $('#infoModal').modal('hide');
                });
            })
            .fail(function (error)
            {
                console.error("Landmarks load error:", error);
                showErrorModal("Landmarks Error", "Failed to load landmarks data");
            })
            .always(hideLoading);
    }

    function showCurrency()
    {
        if (!currentCountryData?.code) return;
        showLoading();

        $.get(`php/getCurrency.php?country=${currentCountryData.code}`)
            .done(function (data)
            {
                if (!data.rates) throw new Error("Invalid currency data");

                let content = `
                    <h4 class="mb-3">Currency Exchange</h4>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h5 class="card-title">${currentCountryData.currency || 'N/A'}</h5>
                                    <p>Base currency: ${data.base}</p>
                                    <p>Last updated: ${new Date(data.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title">Exchange Rates</h5>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Currency</th>
                                                    <th>Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                `;

                const topCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
                topCurrencies.forEach(currency =>
                {
                    if (data.rates[currency])
                    {
                        content += `
                            <tr>
                                <td>${currency}</td>
                                <td>${data.rates[currency].toFixed(4)}</td>
                            </tr>
                        `;
                    }
                });

                content += `
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                showModal('Currency Exchange', content);
            })
            .fail(function (error)
            {
                console.error("Currency load error:", error);
                showErrorModal("Currency Error", "Failed to load currency data");
            })
            .always(hideLoading);
    }

    // ======================
    // EVENT BINDINGS
    // ======================

    function bindEvents()
    {
        // Map type buttons
        $('.map-type-btn').on('click', function ()
        {
            const provider = $(this).data('type');
            changeMapProvider(provider);
        });

        // Checkbox toggles
        $('#showCities, #showAirports, #showWiki').on('change', function ()
        {
            updateMarkersVisibility();
        });

        // Country selection
        $('#countrySelect').on('change', function ()
        {
            const countryCode = $(this).val();
            if (countryCode)
            {
                loadCountryData(countryCode);
            } else
            {
                resetMapView();
            }
        });

        // Location button
        $('#locateBtn').on('click', function ()
        {
            if (navigator.geolocation)
            {
                showLoading("Getting your location...");

                // Clear previous marker
                if (currentLocationMarker)
                {
                    map.removeLayer(currentLocationMarker);
                    currentLocationMarker = null;
                }

                navigator.geolocation.getCurrentPosition(
                    position =>
                    {
                        const { latitude: lat, longitude: lng } = position.coords;

                        // Create new marker
                        currentLocationMarker = L.marker([lat, lng], {
                            icon: L.divIcon({
                                className: 'current-location-icon',
                                html: '<div></div>',
                                iconSize: [16, 16]
                            })
                        }).addTo(map)
                            .bindPopup("Your Current Location")
                            .openPopup();

                        map.setView([lat, lng], 8);

                        // Find country for coordinates
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                            .then(response =>
                            {
                                if (!response.ok) throw new Error('Network response was not ok');
                                return response.json();
                            })
                            .then(data =>
                            {
                                if (data.address?.country_code)
                                {
                                    $('#countrySelect').val(data.address.country_code.toUpperCase()).trigger('change');
                                }
                            })
                            .catch(error =>
                            {
                                console.error("Reverse geocoding error:", error);
                            })
                            .finally(() =>
                            {
                                hideLoading();
                            });
                    },
                    error =>
                    {
                        console.error("Geolocation error:", error);
                        showErrorModal("Location Error", "Could not get your location: " + error.message);
                        hideLoading();
                    }
                );
            } else
            {
                showErrorModal("Location Error", "Geolocation is not supported by your browser");
                hideLoading();
            }
        });

        // Info buttons
        $('#demographicsBtn').on('click', showDemographics);
        $('#weatherBtn').on('click', showWeather);
        $('#wikiBtn').on('click', showWikipedia);
        $('#holidaysBtn').on('click', showHolidays);
        $('#landmarksBtn').on('click', showLandmarks);
        $('#currencyBtn').on('click', showCurrency);
    }

    // ======================
    // INITIALIZATION
    // ======================

    function init()
    {
        initializeMap();
        loadCountries();
        bindEvents();
    }

    init();
});