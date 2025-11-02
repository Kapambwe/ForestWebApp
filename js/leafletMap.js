// Leaflet Map Integration for Zambia Forest Management System
window.leafletMap = (function () {
    'use strict';

    const maps = {};
    const markers = {};
    const polygons = {};

    // Zambia center coordinates
    const ZAMBIA_CENTER = [-13.1339, 27.8493];
    const ZAMBIA_ZOOM = 6;

    // Custom marker icons
    const icons = {
        forest: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        threat: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        species: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        planting: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        default: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    };

    /**
     * Initialize a new map
     */
    function initialize(mapId, lat, lng, zoom) {
        try {
            // Remove existing map if any
            if (maps[mapId]) {
                maps[mapId].remove();
            }

            lat = lat || ZAMBIA_CENTER[0];
            lng = lng || ZAMBIA_CENTER[1];
            zoom = zoom || ZAMBIA_ZOOM;

            const map = L.map(mapId, {
                center: [lat, lng],
                zoom: zoom,
                zoomControl: true,
                scrollWheelZoom: true
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            maps[mapId] = map;
            markers[mapId] = [];
            polygons[mapId] = [];

            // Force map to update size after short delay
            setTimeout(() => {
                map.invalidateSize();
            }, 100);

            return true;
        } catch (error) {
            console.error('Error initializing map:', error);
            return false;
        }
    }

    /**
     * Add a marker to the map
     */
    function addMarker(mapId, lat, lng, popupContent, iconType) {
        try {
            const map = maps[mapId];
            if (!map) {
                console.error('Map not found:', mapId);
                return false;
            }

            const icon = icons[iconType] || icons.default;
            const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

            if (popupContent) {
                marker.bindPopup(popupContent);
            }

            markers[mapId].push(marker);
            return true;
        } catch (error) {
            console.error('Error adding marker:', error);
            return false;
        }
    }

    /**
     * Add multiple markers at once
     */
    function addMarkers(mapId, markerData) {
        try {
            markerData.forEach(data => {
                addMarker(mapId, data.lat, data.lng, data.popup, data.iconType);
            });
            return true;
        } catch (error) {
            console.error('Error adding markers:', error);
            return false;
        }
    }

    /**
     * Add a polygon to the map
     */
    function addPolygon(mapId, coordinates, options) {
        try {
            const map = maps[mapId];
            if (!map) {
                console.error('Map not found:', mapId);
                return false;
            }

            const defaultOptions = {
                color: '#3388ff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.2
            };

            const polygon = L.polygon(coordinates, { ...defaultOptions, ...options }).addTo(map);
            polygons[mapId].push(polygon);
            
            return true;
        } catch (error) {
            console.error('Error adding polygon:', error);
            return false;
        }
    }

    /**
     * Clear all markers from the map
     */
    function clearMarkers(mapId) {
        try {
            if (markers[mapId]) {
                markers[mapId].forEach(marker => marker.remove());
                markers[mapId] = [];
            }
            return true;
        } catch (error) {
            console.error('Error clearing markers:', error);
            return false;
        }
    }

    /**
     * Clear all polygons from the map
     */
    function clearPolygons(mapId) {
        try {
            if (polygons[mapId]) {
                polygons[mapId].forEach(polygon => polygon.remove());
                polygons[mapId] = [];
            }
            return true;
        } catch (error) {
            console.error('Error clearing polygons:', error);
            return false;
        }
    }

    /**
     * Fit map bounds to show all markers
     */
    function fitBounds(mapId) {
        try {
            const map = maps[mapId];
            if (!map || !markers[mapId] || markers[mapId].length === 0) {
                return false;
            }

            const group = L.featureGroup(markers[mapId]);
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
            return true;
        } catch (error) {
            console.error('Error fitting bounds:', error);
            return false;
        }
    }

    /**
     * Set map view
     */
    function setView(mapId, lat, lng, zoom) {
        try {
            const map = maps[mapId];
            if (!map) return false;

            map.setView([lat, lng], zoom || map.getZoom());
            return true;
        } catch (error) {
            console.error('Error setting view:', error);
            return false;
        }
    }

    /**
     * Invalidate map size (call after container resize)
     */
    function invalidateSize(mapId) {
        try {
            const map = maps[mapId];
            if (map) {
                setTimeout(() => map.invalidateSize(), 100);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error invalidating size:', error);
            return false;
        }
    }

    /**
     * Initialize a conservation map with protected areas, threats, and species
     */
    function initializeConservationMap(mapId, protectedAreas, threats, speciesHabitats) {
        try {
            initialize(mapId, ZAMBIA_CENTER[0], ZAMBIA_CENTER[1], ZAMBIA_ZOOM);

            // Add protected areas as polygons
            if (protectedAreas) {
                protectedAreas.forEach(area => {
                    if (area.coordinates && area.coordinates.length > 0) {
                        addPolygon(mapId, area.coordinates, {
                            color: '#10b981',
                            fillColor: '#10b981'
                        });
                    }
                    // Add marker for protected area center
                    if (area.lat && area.lng) {
                        addMarker(mapId, area.lat, area.lng, 
                            `<strong>${area.name}</strong><br>Type: ${area.type}<br>Area: ${area.area} ha`,
                            'forest');
                    }
                });
            }

            // Add threat alerts
            if (threats) {
                threats.forEach(threat => {
                    if (threat.lat && threat.lng) {
                        const severity = threat.priority || 'medium';
                        addMarker(mapId, threat.lat, threat.lng,
                            `<strong>Threat: ${threat.title}</strong><br>Type: ${threat.type}<br>Severity: ${severity}<br>Date: ${threat.date}`,
                            'threat');
                    }
                });
            }

            // Add species habitats
            if (speciesHabitats) {
                speciesHabitats.forEach(habitat => {
                    if (habitat.lat && habitat.lng) {
                        addMarker(mapId, habitat.lat, habitat.lng,
                            `<strong>${habitat.species}</strong><br>Habitat: ${habitat.type}<br>Population: ${habitat.population}`,
                            'species');
                    }
                });
            }

            fitBounds(mapId);
            return true;
        } catch (error) {
            console.error('Error initializing conservation map:', error);
            return false;
        }
    }

    /**
     * Initialize a forest boundary map with optional drawing tools
     */
    function initializeForestBoundaryMap(mapId, lat, lng, boundaryCoordinates, enableDrawing) {
        try {
            initialize(mapId, lat, lng, 12);

            // Add existing boundary if provided
            if (boundaryCoordinates && boundaryCoordinates.length > 0) {
                addPolygon(mapId, boundaryCoordinates, {
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.3
                });
            }

            // Add center marker
            addMarker(mapId, lat, lng, '<strong>Forest Center</strong>', 'forest');

            // If drawing is enabled, you could add Leaflet.draw here
            // For now, just log that drawing is enabled
            if (enableDrawing) {
                console.log('Drawing tools would be enabled here');
            }

            return true;
        } catch (error) {
            console.error('Error initializing forest boundary map:', error);
            return false;
        }
    }

    /**
     * Initialize a reforestation map with planting sites
     */
    function initializeReforestationMap(mapId, sitesData, centerLat, centerLng, zoom) {
        try {
            initialize(mapId, centerLat, centerLng, zoom);

            if (sitesData && sitesData.length > 0) {
                sitesData.forEach(site => {
                    if (site.latitude && site.longitude) {
                        const popup = `<strong>${site.name}</strong><br>` +
                                    `Trees Planted: ${site.treesPlanted}<br>` +
                                    `Survival Rate: ${site.survivalRate}%<br>` +
                                    `District: ${site.district}<br>` +
                                    `Date: ${site.plantingDate}<br>` +
                                    `Species: ${site.species}`;
                        
                        addMarker(mapId, site.latitude, site.longitude, popup, 'planting');
                    }
                });

                fitBounds(mapId);
            }

            return true;
        } catch (error) {
            console.error('Error initializing reforestation map:', error);
            return false;
        }
    }

    // Public API
    return {
        initialize: initialize,
        addMarker: addMarker,
        addMarkers: addMarkers,
        addPolygon: addPolygon,
        clearMarkers: clearMarkers,
        clearPolygons: clearPolygons,
        fitBounds: fitBounds,
        setView: setView,
        invalidateSize: invalidateSize,
        initializeConservationMap: initializeConservationMap,
        initializeForestBoundaryMap: initializeForestBoundaryMap,
        initializeReforestationMap: initializeReforestationMap,
        icons: icons
    };
})();

// Make available globally
window.initializeMap = window.leafletMap.initialize;
window.addMapMarker = window.leafletMap.addMarker;
window.initializeConservationMap = window.leafletMap.initializeConservationMap;
window.initializeForestBoundaryMap = window.leafletMap.initializeForestBoundaryMap;
window.initializeReforestationMap = window.leafletMap.initializeReforestationMap;
