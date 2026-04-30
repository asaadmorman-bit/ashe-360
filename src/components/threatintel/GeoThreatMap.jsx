import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ACTION_COLORS = {
  block: '#f87171',
  challenge: '#fb923c',
  jschallenge: '#fbbf24',
  managed_challenge: '#f97316',
  log: '#60a5fa',
  allow: '#4ade80',
  traffic: '#22d3ee',
};

function getColor(point) {
  if (point.type === 'traffic') return '#22d3ee';
  return ACTION_COLORS[point.action] || '#f87171';
}

function getRadius(count, max) {
  const min = 4, maxR = 22;
  if (!count || !max) return min;
  return min + ((count / max) * (maxR - min));
}

export default function GeoThreatMap({ threatPoints = [], trafficPoints = [], mode = 'threats' }) {
  const points = mode === 'threats' ? threatPoints : trafficPoints;
  const maxCount = Math.max(...points.map(p => p.count || 0), 1);

  return (
    <div className="w-full h-full min-h-[420px] rounded-xl overflow-hidden" style={{ background: '#071520' }}>
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={1}
        maxZoom={6}
        style={{ height: '100%', width: '100%', background: '#071520' }}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
          subdomains="abcd"
          maxZoom={6}
        />
        {points.map((point, i) => (
          <CircleMarker
            key={i}
            center={[point.lat, point.lng]}
            radius={getRadius(point.count, maxCount)}
            pathOptions={{
              color: getColor(point),
              fillColor: getColor(point),
              fillOpacity: 0.65,
              weight: 1,
              opacity: 0.9,
            }}
          >
            <Tooltip>
              <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}>
                <strong>{point.country}</strong><br />
                Count: {point.count?.toLocaleString()}<br />
                {point.action && <>Action: {point.action}<br /></>}
                {point.type === 'traffic' && point.errors > 0 && <>Errors: {point.errors}<br /></>}
                {point.rule_id && point.rule_id !== '—' && <>Rule: {point.rule_id.slice(0, 20)}<br /></>}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}