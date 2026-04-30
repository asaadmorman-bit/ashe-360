import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Eye } from 'lucide-react';

// Country centroids (accurate lat/lng)
const COUNTRY_COORDS = {
  'United States': [37.0, -95.0],
  'China': [35.9, 104.1],
  'Russia': [61.5, 105.3],
  'Germany': [51.2, 10.5],
  'United Kingdom': [55.4, -3.4],
  'France': [46.2, 2.2],
  'Netherlands': [52.1, 5.3],
  'Brazil': [-14.2, -51.9],
  'India': [20.6, 78.9],
  'Canada': [56.1, -106.3],
  'Japan': [36.2, 138.3],
  'South Korea': [35.9, 127.8],
  'Australia': [-25.3, 133.8],
  'Singapore': [1.4, 103.8],
  'Hong Kong': [22.4, 114.1],
  'Ukraine': [48.4, 31.2],
  'Iran': [32.4, 53.7],
  'Vietnam': [14.1, 108.3],
  'Indonesia': [-0.8, 113.9],
  'Mexico': [23.6, -102.6],
  'South Africa': [-30.6, 22.9],
  'Egypt': [26.8, 30.8],
  'Israel': [31.0, 34.9],
  'Unknown': [0, 0],
};

export default function ThreatDataMap({ threatData = [], title = 'Global Threat Activity' }) {
  const mapRef = React.useRef();

  // Process threat data into map markers
  const markers = useMemo(() => {
    if (!threatData || threatData.length === 0) return [];

    const grouped = {};
    threatData.forEach(threat => {
      const country = threat.country || 'Unknown';
      const key = country;
      if (!grouped[key]) {
        grouped[key] = {
          country,
          coords: COUNTRY_COORDS[country] || [0, 0],
          count: 0,
          severity: 'low',
          details: [],
        };
      }
      grouped[key].count += threat.count || 1;
      grouped[key].severity = threat.severity || grouped[key].severity;
      grouped[key].details.push(threat);

      // Update severity to highest
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if ((sevOrder[threat.severity] || 999) < (sevOrder[grouped[key].severity] || 999)) {
        grouped[key].severity = threat.severity;
      }
    });

    return Object.values(grouped).filter(m => m.coords[0] !== 0 || m.coords[1] !== 0);
  }, [threatData]);

  // Color by severity
  const getColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      critical: 'CRITICAL',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW',
    };
    return labels[severity] || 'UNKNOWN';
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/40 bg-gradient-to-r from-blue-500/5 to-transparent shrink-0">
        <Eye className="w-4 h-4 text-blue-400" />
        <h3 className="font-bold text-sm text-foreground">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{markers.length} threat origins</span>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden">
        {markers.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <p className="text-muted-foreground text-sm">No threat data available</p>
          </div>
        ) : (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ width: '100%', height: '100%' }}
            ref={mapRef}
            attributionControl={true}
          >
            {/* Natural Earth 2 tile layer (shows accurate continent sizes) */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri, USGS, NOAA'
              maxZoom={6}
            />

            {/* Threat markers */}
            {markers.map((marker, idx) => {
              const radius = Math.max(8, Math.min(30, Math.log(marker.count + 1) * 8));
              const color = getColor(marker.severity);

              return (
                <CircleMarker
                  key={idx}
                  center={marker.coords}
                  radius={radius}
                  fillColor={color}
                  fillOpacity={0.7}
                  weight={2}
                  color={color}
                  opacity={1}
                >
                  <Popup className="threat-popup">
                    <div className="text-xs space-y-1 p-2 min-w-48">
                      <div className="font-bold text-foreground">{marker.country}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Severity:</span>
                        <span
                          className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                            marker.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : marker.severity === 'high'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {getSeverityLabel(marker.severity)}
                        </span>
                      </div>
                      <div className="text-muted-foreground">Events: {marker.count.toLocaleString()}</div>
                      {marker.details.length > 0 && (
                        <div className="border-t border-border/30 pt-1 mt-1">
                          <div className="text-[10px] font-semibold text-muted-foreground mb-1">Details:</div>
                          {marker.details.slice(0, 3).map((d, i) => (
                            <div key={i} className="text-[10px] text-muted-foreground">
                              {d.action || d.type || 'Unknown'} ({d.count || 0})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-6 py-3 border-t border-border/40 bg-secondary/20 text-xs shrink-0 flex-wrap">
        {['critical', 'high', 'medium', 'low'].map(sev => (
          <div key={sev} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(sev) }} />
            <span className="text-muted-foreground capitalize">{sev}</span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground/60 ml-auto">Marker size = event volume</span>
      </div>
    </div>
  );
}