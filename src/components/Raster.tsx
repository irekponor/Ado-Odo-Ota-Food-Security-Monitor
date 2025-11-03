import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

const Raster: React.FC = () => {
  useEffect(() => {
    // Initialize map
    const map = L.map("map", {
      center: [6.7, 3.0], // Ado-Odo/Ota area
      zoom: 11,
    });

    // Base map
    const baseMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // ✅ NDVI Color Scale (matches your GEE palette)
    const ndviColorScale = (value: number) => {
      if (value === null || isNaN(value)) return null;
      if (value < 0.25) return "#ffffff"; // white
      if (value < 0.5) return "#ffff00"; // yellow
      if (value < 0.75) return "#008000"; // green
      return "#004d00"; // dark green
    };

    // ✅ Rainfall Anomaly Color Scale (matches your GEE palette)
    const rainfallColorScale = (value: number) => {
      if (value === null || isNaN(value)) return null;
      if (value < -50) return "#8b4513"; // brown (low)
      if (value < 0) return "#ffffff"; // white (neutral)
      return "#0000ff"; // blue (high)
    };

    const rasterLayers: Record<string, any> = {};
    let activeGeoRaster: any = null; // currently active raster for popup

    // 🟢 Load NDVI layer (default visible)
    fetch("/Geodata/NDVI_AdoOdoOta_Sep2025.tif")
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => parseGeoraster(arrayBuffer))
      .then((georaster) => {
        const ndviLayer = new GeoRasterLayer({
          georaster,
          opacity: 0.8,
          pixelValuesToColorFn: ndviColorScale,
          resolution: 256,
        });
        rasterLayers["NDVI (Vegetation Health)"] = ndviLayer;
        map.addLayer(ndviLayer); // ✅ add NDVI on load
        map.fitBounds(ndviLayer.getBounds());
        activeGeoRaster = georaster;
      });

    // 🔵 Load Rainfall Anomaly layer (toggle off initially)
    fetch("/Geodata/RainfallAnomaly_AdoOdoOta_Sep2025.tif")
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => parseGeoraster(arrayBuffer))
      .then((georaster) => {
        const rainfallLayer = new GeoRasterLayer({
          georaster,
          opacity: 0.8,
          pixelValuesToColorFn: rainfallColorScale,
          resolution: 256,
        });
        rasterLayers["Rainfall Anomaly"] = rainfallLayer;

        // Don’t add to map by default, user toggles it
      });

      // 📘 NDVI Legend
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend bg-white p-2 rounded shadow");
      const grades = [
        { label: "Low", color: "#ffffff" },
        { label: "Moderate", color: "#ffff00" },
        { label: "Healthy", color: "#008000" },
        { label: "Dense", color: "#004d00" },
      ];

      div.innerHTML += "<strong>NDVI Classes</strong><br/>";
      grades.forEach((g) => {
        div.innerHTML += `
          <i style="background:${g.color}; width:18px; height:18px; float:left; margin-right:8px; opacity:0.9;"></i>${g.label}<br/>
        `;
      });
      return div;
    };
    legend.addTo(map);

    // 📚 Layer Control (NDVI active, Rainfall toggle)
    const baseMaps = { "OpenStreetMap": baseMap };
    const overlayMaps = rasterLayers;
    L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

    // 🏷️ Title + Credits Overlay
    const titleControl = L.control({ position: "topright" });
titleControl.onAdd = function () {
  const div = L.DomUtil.create("div", "map-title bg-white p-2 rounded shadow");
  div.innerHTML = `
    <h4 style="margin:0; font-weight:600;">Food Security Analysis</h4>
    <small>Ado-Odo/Ota — <b>Moderate Risk</b> (September 2025)</small><br/>
    <small>Map by Emmanuel Irekponor, 2025</small>
  `;
  return div;
};
titleControl.addTo(map);


    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      id="map"
      style={{
        height: "100vh",
        width: "100%",
      }}
    />
  );
};

export default Raster;
