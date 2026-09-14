// Advanced Satellite Imagery and GIS Integration for Forest Management
// Supports encroachment detection, NDVI visualization, and change detection

const maps = {};
const layers = {};
const overlays = {};
const changeDetectionData = {};

// Satellite imagery providers
export const IMAGERY_PROVIDERS = {
    sentinel2: {
        name: 'Sentinel-2',
        url: 'https://services.sentinel-hub.com/ogc/wms/{instance_id}',
        attribution: 'Sentinel-2 © ESA'
    },
    landsat: {
        name: 'Landsat 8/9',
        url: 'https://landsatlook.usgs.gov/stac-browser',
        attribution: 'Landsat © USGS/NASA'
    },
    openStreetMap: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    satellite: {
        name: 'Satellite (Esri)',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, DigitalGlobe, GeoEye, i-cubed, USDA FSA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, and the GIS User Community'
    }
};

// NDVI color scale (vegetation health indicator)
export const NDVI_COLORS = {
    0.0: '#8B0000',  // Bare soil/water
    0.2: '#CD853F',  // Sparse vegetation
    0.4: '#FFFF00',  // Moderate vegetation
    0.6: '#90EE90',  // Healthy vegetation
    0.8: '#228B22',  // Dense vegetation
    1.0: '#006400'   // Very dense vegetation
};

// Encroachment severity colors
export const ENCROACHMENT_COLORS = {
    critical: '#DC2626',  // Red
    high: '#F59E0B',      // Orange
    medium: '#FBBF24',    // Yellow
    low: '#10B981'        // Green
};

/**
 * Initialize advanced GIS map with multiple base layers
 */
export function initializeAdvancedMap(mapId, lat, lng, zoom, options = {}) {
    try {
    const defaultOptions = {
        center: [lat || -13.1339, lng || 27.8493],
        zoom: zoom || 6,
        zoomControl: true,
        scrollWheelZoom: true,
        preferCanvas: true // Better performance for large datasets
    };

    const map = L.map(mapId, { ...defaultOptions, ...options });

    // Base layers
    const baseLayers = {
        'OpenStreetMap': L.tileLayer(IMAGERY_PROVIDERS.openStreetMap.url, {
            attribution: IMAGERY_PROVIDERS.openStreetMap.attribution,
            maxZoom: 18
        }),
        'Satellite': L.tileLayer(IMAGERY_PROVIDERS.satellite.url, {
            attribution: IMAGERY_PROVIDERS.satellite.attribution,
            maxZoom: 18
        })
    };

    // Add default base layer
    baseLayers['OpenStreetMap'].addTo(map);

    // Layer control
    const layerControl = L.control.layers(baseLayers, {}, {
        position: 'topright',
        collapsed: false
    }).addTo(map);

    // Scale control
    L.control.scale({
        position: 'bottomleft',
        imperial: false,
        metric: true
    }).addTo(map);

    // Store map and layer control
    maps[mapId] = map;
    layers[mapId] = {
        base: baseLayers,
        control: layerControl,
        overlays: {}
    };

    // Force map to update size
    setTimeout(() => map.invalidateSize(), 100);

    return { success: true, mapId: mapId };
    } catch (error) {
    console.error('Error initializing advanced map:', error);
    return { success: false, error: error.message };
    }
}

/**
 * Add NDVI (Normalized Difference Vegetation Index) overlay
 * Visualizes vegetation health from satellite imagery
 */
export function addNDVILayer(mapId, ndviData, options = {}) {
    try {
    const map = maps[mapId];
    if (!map) throw new Error('Map not found');

    const defaultOptions = {
        opacity: 0.7,
        interactive: true,
        pane: 'overlayPane'
    };

    // Create heat map layer for NDVI visualization
    const ndviPoints = ndviData.map(point => [
        point.lat,
        point.lng,
        point.ndvi // NDVI value between -1 and 1
    ]);

    // NDVI Layer using polygon representation
    const ndviLayer = L.layerGroup();

    ndviData.forEach(point => {
        if (point.geometry && point.geometry.coordinates) {
            const color = getNDVIColor(point.ndvi);
            const polygon = L.polygon(point.geometry.coordinates, {
                color: color,
                fillColor: color,
                fillOpacity: options.opacity || 0.7,
                weight: 1
            });

            polygon.bindPopup(`
                <strong>NDVI Value: ${point.ndvi.toFixed(3)}</strong><br>
                Health: ${getNDVIStatus(point.ndvi)}<br>
                Date: ${point.date || 'N/A'}<br>
                Location: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}
            `);

            polygon.addTo(ndviLayer);
        }
    });

    ndviLayer.addTo(map);
    layers[mapId].overlays['NDVI Layer'] = ndviLayer;
    layers[mapId].control.addOverlay(ndviLayer, 'NDVI Vegetation Health');

    // Add NDVI legend
    addNDVILegend(mapId);

    return { success: true, layer: 'NDVI' };
    } catch (error) {
    console.error('Error adding NDVI layer:', error);
    return { success: false, error: error.message };
    }
}

/**
 * Add change detection layer (deforestation/encroachment alerts)
 */
export function addChangeDetectionLayer(mapId, changeData, options = {}) {
    try {
        const map = maps[mapId];
        if (!map) throw new Error('Map not found');

        const changeLayer = L.layerGroup();

        changeData.forEach(change => {
            if (change.geometry && change.geometry.coordinates) {
                const color = ENCROACHMENT_COLORS[change.severity] || '#999999';
                
                const polygon = L.polygon(change.geometry.coordinates, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5,
                    weight: 2,
                    className: 'change-detection-polygon'
                });

                // Popup with change information
                const popupContent = `
                    <div style="min-width: 200px;">
                        <strong style="color: ${color};">⚠ ${change.type || 'Forest Change Detected'}</strong><br>
                        <strong>Severity:</strong> ${change.severity.toUpperCase()}<br>
                        <strong>Area:</strong> ${change.area_ha.toFixed(2)} hectares<br>
                        <strong>Detection Date:</strong> ${change.detectionDate}<br>
                        <strong>Change Type:</strong> ${change.changeType || 'Unknown'}<br>
                        <strong>Confidence:</strong> ${(change.confidence * 100).toFixed(1)}%<br>
                        ${change.description ? `<br><em>${change.description}</em>` : ''}
                    </div>
                `;

                polygon.bindPopup(popupContent);

                // Add click event for detailed analysis
                polygon.on('click', function (e) {
                    if (options.onClickCallback) {
                        options.onClickCallback(change);
                    }
                });

                polygon.addTo(changeLayer);
            }
        });

        changeLayer.addTo(map);
        layers[mapId].overlays['Change Detection'] = changeLayer;
        layers[mapId].control.addOverlay(changeLayer, '🚨 Encroachment Alerts');

        // Store change data for further analysis
        changeDetectionData[mapId] = changeData;

        return { success: true, alertCount: changeData.length };
    } catch (error) {
        console.error('Error adding change detection layer:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add protected areas layer
 */
export function addProtectedAreasLayer(mapId, protectedAreas) {
    try {
        const map = maps[mapId];
        if (!map) throw new Error('Map not found');

        const protectedLayer = L.layerGroup();

        protectedAreas.forEach(area => {
            if (area.geometry && area.geometry.coordinates) {
                const polygon = L.polygon(area.geometry.coordinates, {
                    color: '#10B981',
                    fillColor: '#10B981',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5'
                });

                polygon.bindPopup(`
                    <strong>🛡️ ${area.name}</strong><br>
                    <strong>Type:</strong> ${area.type}<br>
                    <strong>Area:</strong> ${area.area_ha.toFixed(0)} ha<br>
                    <strong>Status:</strong> ${area.status || 'Protected'}<br>
                    ${area.established ? `<strong>Established:</strong> ${area.established}<br>` : ''}
                `);

                polygon.addTo(protectedLayer);
            }
        });

        protectedLayer.addTo(map);
        layers[mapId].overlays['Protected Areas'] = protectedLayer;
        layers[mapId].control.addOverlay(protectedLayer, '🛡️ Protected Areas');

        return { success: true };
    } catch (error) {
        console.error('Error adding protected areas layer:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add time series slider for temporal analysis
 */
export function addTimeSeriesSlider(mapId, timeSeriesData, containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) throw new Error('Container not found');

        // Create slider HTML
        container.innerHTML = `
            <div style="padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <label for="timeSlider" style="font-weight: 600; margin-bottom: 5px; display: block;">
                    Time Series Analysis
                </label>
                <input type="range" id="timeSlider" min="0" max="${timeSeriesData.length - 1}" 
                       value="0" style="width: 100%; margin-bottom: 5px;">
                <div id="timeDisplay" style="text-align: center; font-size: 14px; color: #666;">
                    ${timeSeriesData[0].date}
                </div>
            </div>
        `;

        const slider = document.getElementById('timeSlider');
        const display = document.getElementById('timeDisplay');

        slider.addEventListener('input', function (e) {
            const index = parseInt(e.target.value);
            const currentData = timeSeriesData[index];
            display.textContent = currentData.date;

            // Update map with current time step data
            updateMapWithTimeStep(mapId, currentData);
        });

        return { success: true };
    } catch (error) {
        console.error('Error adding time series slider:', error);
        return { success: false, error: error.message };
    }
    }

/**
     * Calculate and display change statistics
     */
export function displayChangeStatistics(mapId, containerId) {
    try {
        const changeData = changeDetectionData[mapId];
        if (!changeData || changeData.length === 0) {
            return { success: false, error: 'No change data available' };
        }

        const stats = {
            total: changeData.length,
            totalArea: changeData.reduce((sum, c) => sum + c.area_ha, 0),
            bySeverity: {
                critical: changeData.filter(c => c.severity === 'critical').length,
                high: changeData.filter(c => c.severity === 'high').length,
                medium: changeData.filter(c => c.severity === 'medium').length,
                low: changeData.filter(c => c.severity === 'low').length
            },
            avgConfidence: changeData.reduce((sum, c) => sum + c.confidence, 0) / changeData.length
        };

        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="padding: 15px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin-top: 0; color: #1F2937;">Change Detection Statistics</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <strong>Total Alerts:</strong> ${stats.total}
                        </div>
                        <div>
                            <strong>Total Area:</strong> ${stats.totalArea.toFixed(2)} ha
                        </div>
                        <div style="color: ${ENCROACHMENT_COLORS.critical}">
                            <strong>Critical:</strong> ${stats.bySeverity.critical}
                        </div>
                        <div style="color: ${ENCROACHMENT_COLORS.high}">
                            <strong>High:</strong> ${stats.bySeverity.high}
                        </div>
                        <div style="color: ${ENCROACHMENT_COLORS.medium}">
                            <strong>Medium:</strong> ${stats.bySeverity.medium}
                        </div>
                        <div style="color: ${ENCROACHMENT_COLORS.low}">
                            <strong>Low:</strong> ${stats.bySeverity.low}
                        </div>
                        <div style="grid-column: span 2;">
                            <strong>Avg. Confidence:</strong> ${(stats.avgConfidence * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            `;
        }

        return { success: true, stats: stats };
    } catch (error) {
        console.error('Error displaying change statistics:', error);
        return { success: false, error: error.message };
    }
    }

/**
 * Helper: Get NDVI color based on value
 */
export function getNDVIColor(ndvi) {
    if (ndvi < 0.2) return NDVI_COLORS[0.0];
    if (ndvi < 0.4) return NDVI_COLORS[0.2];
    if (ndvi < 0.6) return NDVI_COLORS[0.4];
    if (ndvi < 0.8) return NDVI_COLORS[0.6];
    return NDVI_COLORS[0.8];
}

/**
 * Helper: Get NDVI status description
 */
export function getNDVIStatus(ndvi) {
    if (ndvi < 0.2) return 'Bare/Stressed';
    if (ndvi < 0.4) return 'Sparse Vegetation';
    if (ndvi < 0.6) return 'Moderate Vegetation';
    if (ndvi < 0.8) return 'Healthy Vegetation';
    return 'Dense Vegetation';
}

/**
 * Helper: Add NDVI legend to map
 */
export function addNDVILegend(mapId) {
    const map = maps[mapId];
    if (!map) return;

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.background = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '4px';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

        div.innerHTML = '<strong>NDVI Legend</strong><br>';
        
        const grades = [0.0, 0.2, 0.4, 0.6, 0.8];
        const labels = ['Bare', 'Sparse', 'Moderate', 'Healthy', 'Dense'];

        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                `<div style="margin: 3px 0;">
                    <span style="background:${NDVI_COLORS[grades[i]]}; width:20px; height:15px; display:inline-block; margin-right:5px;"></span>
                    ${labels[i]}
                </div>`;
        }

        return div;
    };

    legend.addTo(map);
    }

/**
     * Helper: Update map with time step data
     */
export function updateMapWithTimeStep(mapId, timeStepData) {
    const map = maps[mapId];
    if (!map) return;

    // Clear existing change detection layer
    if (layers[mapId].overlays['Change Detection']) {
        map.removeLayer(layers[mapId].overlays['Change Detection']);
    }

    // Add new data for this time step
    if (timeStepData.changes) {
        addChangeDetectionLayer(mapId, timeStepData.changes);
    }
    }

/**
     * Export map data as GeoJSON
     */
export function exportAsGeoJSON(mapId) {
    try {
        const data = changeDetectionData[mapId];
        if (!data) throw new Error('No data to export');

        const geoJSON = {
            type: 'FeatureCollection',
            features: data.map(change => ({
                type: 'Feature',
                properties: {
                    type: change.type,
                    severity: change.severity,
                    area_ha: change.area_ha,
                    detectionDate: change.detectionDate,
                    confidence: change.confidence
                },
                geometry: change.geometry
            }))
        };

        return { success: true, data: geoJSON };
    } catch (error) {
        console.error('Error exporting GeoJSON:', error);
        return { success: false, error: error.message };
    }
    }

/**
     * Toggle layer visibility
     */
export function toggleLayer(mapId, layerName, visible) {
    try {
        const map = maps[mapId];
        const layer = layers[mapId].overlays[layerName];
        
        if (!map || !layer) throw new Error('Map or layer not found');

        if (visible) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }

        return { success: true };
    } catch (error) {
        console.error('Error toggling layer:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Clear all overlays
 */
export function clearAllOverlays(mapId) {
    try {
        const map = maps[mapId];
        if (!map) throw new Error('Map not found');

        Object.keys(layers[mapId].overlays).forEach(key => {
            map.removeLayer(layers[mapId].overlays[key]);
        });

        layers[mapId].overlays = {};
        changeDetectionData[mapId] = [];

        return { success: true };
    } catch (error) {
        console.error('Error clearing overlays:', error);
        return { success: false, error: error.message };
    }
}
