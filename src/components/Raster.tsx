
import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
 
// @ts-ignore
import parseGeoraster from "georaster";
 
import GeoRasterLayer from "georaster-layer-for-leaflet";

const Raster: React.FC = () => {
  useEffect(() => {
    const map = L.map("map", {
      center: [6.7, 3.0],
      zoom: 11,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const ndviColorScale = (values: number[]) => {
      const value = values[0];  
      if (value === null || isNaN(value)) return null;
      if (value < 0.25) return "#ffffff";  
      if (value < 0.5) return "#ffff00";
      if (value < 0.75) return "#008000"; 
      return "#004d00";  
      };

    fetch("/Geodata/NDVI_AdoOdoOta_Sep2025.tif") 
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => parseGeoraster(arrayBuffer))
      .then((georaster: any) => {
        const ndviLayer = new GeoRasterLayer({
          georaster,
          opacity: 1,
          pixelValuesToColorFn: ndviColorScale,
          resolution:  256,
        });

        ndviLayer.addTo(map);
        map.fitBounds(ndviLayer.getBounds());
      });

    // @ts-ignore
    const legend = L.control({ position: "bottomright" }) as L.Control;
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

    // @ts-ignore
    const titleControl = L.control({ position: "topright" }) as L.Control;
    titleControl.onAdd = function () {
      const div = L.DomUtil.create("div", "map-title bg-white p-2 mt-20 rounded shadow");
      div.innerHTML = `
        <h3 style="margin:0; font-weight:600;">Food Security Analysis</h3>
        <b><h4>Ado-Odo/Ota — Low Risk</b> (October 2025)</h4><br/>
        Map by Emmanuel Irekponor, 2025
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
