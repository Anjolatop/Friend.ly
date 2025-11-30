import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatDistanceToNow } from 'date-fns';

// Token-free MapLibre style using OSM tiles
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const MapView = ({ posts, onPostClick, center, zoom = 4 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Destroy existing map if it exists
    if (map.current) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current.remove();
      map.current = null;
    }

    // Default center to USA (geographic center)
    const defaultCenter = center || [-98.5795, 39.8283];
    const defaultZoom = center ? zoom : 3.8;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: OSM_STYLE,
      center: defaultCenter,
      zoom: defaultZoom,
      attributionControl: true,
      maxZoom: 19,
    });

    // Add controls similar to Google Maps
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: false
      }),
      'top-right'
    );
    map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'imperial' }), 'bottom-left');

    // Handle errors
    map.current.on('error', (e) => {
      console.error('Map error:', e.error?.message || e);
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        markers.current.forEach(marker => marker.remove());
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  // Update markers when posts change
  useEffect(() => {
    if (!map.current) return;

    // Wait for map to be ready
    const addMarkers = () => {
      // Clean up existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      const bounds = new maplibregl.LngLatBounds();
      let hasMarkers = false;

      posts.forEach(post => {
        if (post.location && post.location.latitude && post.location.longitude) {
          // Create marker container
          const markerContainer = document.createElement('div');
          markerContainer.style.position = 'relative';
          markerContainer.style.cursor = 'pointer';

          // Create marker dot - make it more visible on aerial/satellite-like map
          const el = document.createElement('div');
          el.className = 'marker';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = post.is_available ? '#10b981' : '#ef4444';
          el.style.border = '4px solid white';
          el.style.boxShadow = '0 3px 6px rgba(0,0,0,0.5), 0 0 0 2px rgba(0,0,0,0.2)';
          el.style.zIndex = '10';
          el.style.cursor = 'pointer';

          // Extract city name for label
          const locationName = post.location?.name || '';
          const address = post.location?.address || '';
          const cityMatch = address.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*), [A-Z]{2}/) ||
                           locationName.match(/(New York|Los Angeles|Chicago|Houston|Miami|Philadelphia|Phoenix|Dallas|San Francisco|Seattle)/);
          const cityName = cityMatch ? cityMatch[1] : null;

          // Create city label
          if (cityName) {
            const label = document.createElement('div');
            label.textContent = cityName;
            label.style.position = 'absolute';
            label.style.top = '35px';
            label.style.left = '50%';
            label.style.transform = 'translateX(-50%)';
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            label.style.padding = '3px 8px';
            label.style.borderRadius = '6px';
            label.style.fontSize = '11px';
            label.style.fontWeight = '700';
            label.style.color = '#1f2937';
            label.style.whiteSpace = 'nowrap';
            label.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)';
            label.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            label.style.pointerEvents = 'none';
            label.style.zIndex = '20';
            label.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.8)';
            markerContainer.appendChild(label);
          }

          markerContainer.appendChild(el);

          // Use the cityName already extracted above, or fallback to location name
          const popupCityName = cityName || (post.location?.name || 'Location');

          const popup = new maplibregl.Popup({
            offset: 25,
            maxWidth: '320px',
            className: 'custom-popup'
          }).setHTML(`
            <div class="p-4 bg-white rounded-lg">
              ${post.image_url ? `
                <div class="mb-3 -mx-4 -mt-4">
                  <img src="${post.image_url}" alt="${post.title}" class="w-full h-32 object-cover rounded-t-lg" />
                </div>
              ` : ''}
              <div class="mb-2">
                <p class="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">${popupCityName}</p>
                <h3 class="font-bold text-lg text-gray-900">${post.title}</h3>
                ${post.price !== null && post.price !== undefined ? `<p class="text-sm font-semibold text-primary-700 mt-1">$${Number(post.price).toFixed(2)}</p>` : ''}
              </div>
              <p class="text-sm text-gray-700 mt-2">${post.description || ''}</p>
              <div class="mt-3 space-y-2 pt-3 border-t border-gray-200">
                ${post.location?.name ? `<p class="text-xs text-gray-600"><strong class="text-gray-800">Location:</strong> ${post.location.name}</p>` : ''}
                ${post.distance ? `<p class="text-xs text-gray-600"><strong class="text-gray-800">Distance:</strong> ${post.distance.toFixed(1)} km away</p>` : ''}
                ${post.available_until ? `<p class="text-xs text-gray-600"><strong class="text-gray-800">Available:</strong> ${formatDistanceToNow(new Date(post.available_until), { addSuffix: true })}</p>` : ''}
                ${post.quantity ? `<p class="text-xs font-semibold text-green-600"><strong>Quantity:</strong> ${post.quantity - (post.quantity_claimed || 0)} left</p>` : ''}
              </div>
            </div>
          `);

          const lngLat = [post.location.longitude, post.location.latitude];
          const marker = new maplibregl.Marker(markerContainer)
            .setLngLat(lngLat)
            .setPopup(popup)
            .addTo(map.current);

          bounds.extend(lngLat);
          hasMarkers = true;

          markerContainer.addEventListener('click', () => {
            if (onPostClick) {
              onPostClick(post);
            }
          });

          markers.current.push(marker);
        }
      });

      // Fit map to show all markers if we have posts and no specific center
      if (hasMarkers && !center && map.current) {
        try {
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 6
          });
        } catch (e) {
          console.log('Could not fit bounds:', e);
        }
      }
    };

    if (!map.current.loaded()) {
      map.current.once('load', addMarkers);
    } else {
      addMarkers();
    }
  }, [posts, center, onPostClick]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default MapView;
