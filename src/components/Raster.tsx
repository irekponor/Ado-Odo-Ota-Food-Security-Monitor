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
      zoom: 10,
    });

    // Add OpenStreetMap base
    const baseMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Color scales
    const ndviColorScale = (value: number) => {
      if (value === null) return null;
      if (value < 0.2) return "#d73027"; // Red - low
      if (value < 0.4) return "#fee08b"; // Yellow
      if (value < 0.6) return "#1a9850"; // Green
      return "#006837"; // Dark Green
    };

    const rainfallColorScale = (value: number) => {
      if (value === null) return null;
      if (value < -50) return "#d73027"; // much below average
      if (value < 0) return "#fc8d59"; // below normal
      if (value < 50) return "#91bfdb"; // near normal
      return "#4575b4"; // above normal
    };

    const rasterLayers: Record<string, any> = {};
    let activeGeoRaster: any = null; // To track active raster for popups

    // NDVI LAYER
    fetch("/geodata/ndvi.tif")
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
        map.addLayer(ndviLayer);
        map.fitBounds(ndviLayer.getBounds());
        activeGeoRaster = georaster; // Set as active for popup
      });

    // RAINFALL ANOMALY LAYER
    fetch("/geodata/rainfall_anomaly.tif")
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
      });

    // 📍 Popup on click — show pixel value
    map.on("click", async (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (!activeGeoRaster) return;

      const pixelValue = activeGeoRaster.values[0][
        Math.floor(activeGeoRaster.height - activeGeoRaster.yFromLatLng(lat))
      ]?.[Math.floor(activeGeoRaster.xFromLng(lng))];

      if (pixelValue !== undefined) {
        L.popup()
          .setLatLng([lat, lng])
          .setContent(`<b>Value:</b> ${pixelValue.toFixed(2)}`)
          .openOn(map);
      } else {
        L.popup()
          .setLatLng([lat, lng])
          .setContent("No data at this location")
          .openOn(map);
      }
    });

    // 📘 Add Legend
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend bg-white p-2 rounded shadow");
      const grades = [
        { label: "Low Vegetation", color: "#d73027" },
        { label: "Moderate", color: "#fee08b" },
        { label: "Good", color: "#1a9850" },
        { label: "High / Dense", color: "#006837" },
      ];

      div.innerHTML += "<strong>NDVI Classes</strong><br/>";
      grades.forEach((g) => {
        div.innerHTML += `
          <i style="background:${g.color}; width:18px; height:18px; float:left; margin-right:8px; opacity:0.8;"></i>${g.label}<br/>
        `;
      });
      return div;
    };
    legend.addTo(map);

    // 📚 Layer Control
    const baseMaps = { "OpenStreetMap": baseMap };
    L.control.layers(baseMaps, rasterLayers, { collapsed: false }).addTo(map);

    // 🏷️ Title + Credits Overlay
    const titleControl = L.control({ position: "topright" });
    titleControl.onAdd = function () {
      const div = L.DomUtil.create("div", "map-title bg-white p-2 rounded shadow");
      div.innerHTML = `
        <h4 style="margin:0; font-weight:600;">Food Security Analysis</h4>
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
