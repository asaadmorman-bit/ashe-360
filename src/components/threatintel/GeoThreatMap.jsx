import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
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

const US_TARGET = [38.0, -97.0]; // EDS HQ approximate

function getColor(point) {
  if (point.type === 'traffic') return '#22d3ee';
  return ACTION_COLORS[point.action] || '#f87171';
}

function getRadius(count, max) {
  const min = 5, maxR = 26;
  if (!count || !max) return min;
  return min + ((count / max) * (maxR - min));
}

// Draws animated SVG arcs on top of the map using a Leaflet overlay pane
function AttackArcs({ points, mode }) {
  const map = useMap();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (mode !== 'threats') return;

    // Create a full-map canvas overlay
    const size = map.getSize();
    const canvas = document.createElement('canvas');
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:650;';
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');

    // Filter to hostile threat points only
    const hostilePoints = points.filter(p =>
      ['block', 'challenge', 'managed_challenge', 'jschallenge'].includes(p.action) &&
      p.lat !== 0 && p.lng !== 0 && p.count > 0
    ).slice(0, 20);

    // Initialize particles along arcs
    const initParticles = () => {
      particlesRef.current = hostilePoints.map(p => {
        const color = ACTION_COLORS[p.action] || '#f87171';
        return {
          origin: [p.lat, p.lng],
          color,
          count: p.count,
          progress: Math.random(), // stagger starts
          speed: 0.003 + Math.random() * 0.004,
        };
      });
    };

    initParticles();

    const reposition = () => {
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      canvas.style.transform = `translate(${topLeft.x}px,${topLeft.y}px)`;
    };

    const draw = () => {
      const sz = map.getSize();
      canvas.width = sz.x;
      canvas.height = sz.y;
      ctx.clearRect(0, 0, sz.x, sz.y);

      const target = map.latLngToContainerPoint(US_TARGET);

      particlesRef.current.forEach(p => {
        const origin = map.latLngToContainerPoint(p.origin);

        // Bezier control point (arc height)
        const mx = (origin.x + target.x) / 2;
        const my = Math.min(origin.y, target.y) - Math.abs(target.x - origin.x) * 0.3;

        // Draw faint arc trail
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.quadraticCurveTo(mx, my, target.x, target.y);
        ctx.strokeStyle = p.color + '22';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Draw traveling particle
        const t = p.progress;
        const px = (1 - t) * (1 - t) * origin.x + 2 * (1 - t) * t * mx + t * t * target.x;
        const py = (1 - t) * (1 - t) * origin.y + 2 * (1 - t) * t * my + t * t * target.y;

        // Particle glow
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 5);
        grad.addColorStop(0, p.color + 'ff');
        grad.addColorStop(1, p.color + '00');
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Advance
        p.progress += p.speed;
        if (p.progress >= 1) p.progress = 0;
      });

      // Draw pulsing target ring at US
      const now = Date.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(now * 3);
      ctx.beginPath();
      ctx.arc(target.x, target.y, 8 + pulse * 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,229,200,${0.6 + pulse * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5c8';
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    map.on('move zoom', reposition);
    reposition();
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      map.off('move zoom', reposition);
      if (pane.contains(canvas)) pane.removeChild(canvas);
    };
  }, [map, points, mode]);

  return null;
}

// Pulse ring effect on high-severity markers
function PulseRings({ points, mode }) {
  const map = useMap();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 800);
    return () => clearInterval(id);
  }, []);

  return null; // handled via CSS animation on CircleMarker
}

export default function GeoThreatMap({ threatPoints = [], trafficPoints = [], mode = 'threats' }) {
  const points = mode === 'threats' ? threatPoints : trafficPoints;
  const maxCount = Math.max(...points.map(p => p.count || 0), 1);

  return (
    <div className="w-full h-full min-h-[420px] rounded-xl overflow-hidden relative" style={{ background: '#050e17' }}>
      {/* Live indicator */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/10">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping absolute" />
        <span className="w-2 h-2 rounded-full bg-red-400 ml-0" />
        <span className="text-xs font-mono text-white/80 ml-3">LIVE · 48h window</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1 px-3 py-2 rounded-lg bg-black/60 backdrop-blur border border-white/10">
        {mode === 'threats' ? (
          <>
            {[
              { color: '#f87171', label: 'Block' },
              { color: '#fb923c', label: 'Challenge' },
              { color: '#fbbf24', label: 'JS Challenge' },
              { color: '#60a5fa', label: 'Log/Monitor' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <span className="text-xs text-white/70 font-mono">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1 border-t border-white/10 pt-1">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-cyan-400" />
              <span className="text-xs text-white/70 font-mono">EDS Protected</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-cyan-400" />
            <span className="text-xs text-white/70 font-mono">Traffic volume</span>
          </div>
        )}
      </div>

      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={1}
        maxZoom={6}
        style={{ height: '100%', width: '100%', background: '#050e17' }}
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

        {/* Attack arc animations (threats mode only) */}
        <AttackArcs points={points} mode={mode} />

        {/* Geo markers */}
        {points.map((point, i) => {
          const color = getColor(point);
          const radius = getRadius(point.count, maxCount);
          const isHigh = point.count > maxCount * 0.3;
          return (
            <CircleMarker
              key={i}
              center={[point.lat, point.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: isHigh ? 0.85 : 0.55,
                weight: isHigh ? 2 : 1,
                opacity: 0.95,
              }}
            >
              <Tooltip>
                <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, minWidth: 160 }}>
                  <div style={{ fontWeight: 'bold', color: color, marginBottom: 4 }}>
                    {point.country}
                  </div>
                  <div>Events: <strong>{point.count?.toLocaleString()}</strong></div>
                  {point.action && <div>Action: <span style={{ color }}>{point.action}</span></div>}
                  {point.source && point.source !== '—' && <div>Source: {point.source}</div>}
                  {point.type === 'traffic' && point.errors > 0 && (
                    <div style={{ color: '#f87171' }}>Errors: {point.errors?.toLocaleString()}</div>
                  )}
                  {point.rule_id && point.rule_id !== '—' && (
                    <div style={{ color: '#94a3b8' }}>Rule: {point.rule_id.slice(0, 24)}</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* US target node (always shown in threat mode) */}
        {mode === 'threats' && (
          <CircleMarker
            center={US_TARGET}
            radius={8}
            pathOptions={{
              color: '#00e5c8',
              fillColor: '#00e5c8',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip permanent={false}>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                <strong style={{ color: '#00e5c8' }}>EDS Protected Zone</strong><br />
                United States · SOCaaS Active
              </div>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}