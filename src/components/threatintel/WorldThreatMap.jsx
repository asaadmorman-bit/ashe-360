import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Dark tile layer that matches EDS theme
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function AnimatedPoint({ point, index }) {
  const isThreat = point.type === 'threat';
  const radius = Math.min(4 + Math.log1p(point.count) * 2.5, 22);
  const color = isThreat
    ? (point.count > 100 ? '#f87171' : point.count > 20 ? '#fb923c' : '#fbbf24')
    : '#00e5c8';

  return (
    <CircleMarker
      center={[point.lat, point.lng]}
      radius={radius}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: isThreat ? 0.7 : 0.3,
        weight: isThreat ? 1.5 : 0.5,
        opacity: 0.9,
      }}
    >
      <Tooltip sticky>
        <div className="text-xs">
          <p className="font-bold">{point.country}</p>
          <p>{isThreat ? `🚨 ${point.count} events` : `🌐 ${point.count} requests`}</p>
          {point.action && <p className="text-gray-400">Action: {point.action}</p>}
          {point.source && <p className="text-gray-400">Source: {point.source}</p>}
        </div>
      </Tooltip>
    </CircleMarker>
  );
}

function PulsePoint({ lat, lng, color, radius }) {
  return (
    <>
      <CircleMarker center={[lat, lng]} radius={radius} pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 0 }} />
      <CircleMarker center={[lat, lng]} radius={radius + 6} pathOptions={{ color, fillColor: 'transparent', weight: 1, opacity: 0.4 }} />
    </>
  );
}

export default function WorldThreatMap({ threatPoints = [], trafficPoints = [], loading = false }) {
  const allPoints = [
    ...threatPoints.map(p => ({ ...p, type: 'threat' })),
    ...trafficPoints.filter(p => !threatPoints.find(t => t.country === p.country)).slice(0, 15).map(p => ({ ...p, type: 'traffic' })),
  ].filter(p => p.lat !== 0 || p.lng !== 0);

  const totalThreats = threatPoints.reduce((a, p) => a + p.count, 0);
  const topThreat = threatPoints.reduce((a, p) => (p.count > (a?.count || 0) ? p : a), null);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border/50" style={{ height: 480 }}>
      {/* Legend overlay */}
      <div className="absolute top-3 left-3 z-[1000] glass-panel rounded-lg px-3 py-2 space-y-1.5 text-xs">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />Critical Threat (&gt;100 events)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />High Threat (20–100)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />Elevated (&lt;20)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary inline-block opacity-60" />Normal Traffic</div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-3 right-3 z-[1000] glass-panel rounded-lg px-3 py-2 space-y-1 text-xs text-right">
        <p className="text-muted-foreground">24h Firewall Events</p>
        <p className="text-red-400 font-bold text-base">{totalThreats.toLocaleString()}</p>
        {topThreat && <p className="text-muted-foreground">Top: <span className="text-foreground font-medium">{topThreat.country}</span></p>}
        <p className="text-muted-foreground">{threatPoints.length} threat origins</p>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading threat map…</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: '#071520' }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url={DARK_TILE} attribution={DARK_ATTR} />
        {allPoints.map((point, i) => (
          <AnimatedPoint key={`${point.country}-${i}`} point={point} index={i} />
        ))}
      </MapContainer>
    </div>
  );
}