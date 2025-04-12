import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import { useInView } from "react-intersection-observer";
import "./App.css";

// Importing GeoJson zip files for different states
// TODO: Find county level geojson files
import caZip from "./ca_california_zip_codes_geo.min.json";
import coZip from "./co_colorado_zip_codes_geo.min.json"; // Colorado file (for Denver)
import hiZip from "./hi_hawaii_zip_codes_geo.min.json"; // Hawaii file (for Honolulu)

//Add an .env file and load your token from there.
// Mapbox token here
mapboxgl.accessToken =
  "pk.eyJ1Ijoic3BlbmNtYSIsImEiOiJjbTg5Nm94d28wMnpxMmxteG1ueXRwMTdnIn0.4vub8d3a64SRRTAbkus4Nw";

// City configurations
const SF = {
  name: "San Francisco",
  coords: [-122.4194, 37.7749],
  zoom: 10,
  pitch: 60,
  bearing: -17.6,
};

const DENVER = {
  name: "Denver",
  coords: [-104.9903, 39.7392],
  zoom: 10,
  pitch: 60,
  bearing: -17.6,
};

const HONOLULU = {
  name: "Honolulu",
  coords: [-157.8583, 21.3069],
  zoom: 10,
  pitch: 60,
  bearing: -17.6,
};

// --- Dummy Zip Code Arrays ---
// (These should be adjusted to match your actual data ranges.)
// TODO: Replace this with the real data
const sfZipCodes = [
  "94112",
  "94110",
  "94122",
  "94109",
  "94116",
  "94117",
  "94118",
  "94121",
  "94134",
  "94175",
  "94124",
  "94114",
  "94102",
  "94115",
  "94103",
  "94167",
  "94131",
  "94132",
  "94107",
  "94138",
  "94165",
  "94133",
  "94166",
  "94123",
  "94106",
  "94150",
  "94152",
  "94127",
  "94168",
  "94170",
  "94105",
  "94135",
  "94108",
  "94169",
  "94158",
  "94136",
  "94155",
  "94111",
  "94129",
  "94130",
  "94104",
  "94101",
  "94153",
  "94154",
  "94156",
  "94162",
  "94171",
  "94199",
  "94157",
  "94119",
  "94120",
  "94126",
  "94137",
  "94139",
  "94141",
  "94140",
  "94143",
  "94142",
  "94145",
  "94144",
  "94147",
  "94146",
  "94151",
  "94159",
  "94161",
  "94160",
  "94163",
  "94164",
  "94172",
  "94188",
  "94177",
];

const denverZipCodes = [
  "80202",
  "80203",
  "80204",
  "80205",
  "80206",
  "80207",
  "80209",
];

const honoluluZipCodes = ["96813", "96814", "96815", "96816", "96817", "96818"];

// Helper: assign a dummy value based on zip code membership and last two digits.
function assignManualValue(feature) {
  const zip = feature.properties.ZCTA5CE10;
  let value = 50;
  if (sfZipCodes.includes(zip)) {
    value = parseInt(zip.slice(-2)) * 10; // SF: last two digits * 10
  } else if (denverZipCodes.includes(zip)) {
    value = parseInt(zip.slice(-2)) * 5; // Denver: last two digits * 5
  } else if (honoluluZipCodes.includes(zip)) {
    value = parseInt(zip.slice(-2)) * 8; // Honolulu: last two digits * 8
  }
  feature.properties.value = value;
  return feature;
}

const Scrollytelling = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  // Create a ref for the text column (scroll container)
  const textColumnRef = useRef(null);

  // Use the same Intersection Observer options for each section.
  const [refSFSection, inViewSFSection] = useInView({ threshold: 0.5 });
  const [refDenverSection, inViewDenverSection] = useInView({ threshold: 0.5 });
  const [refHonoluluSection, inViewHonoluluSection] = useInView({
    threshold: 0.5,
  });

  // Ensure the text column starts at the top on mount
  useEffect(() => {
    if (textColumnRef.current) {
      textColumnRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: SF.coords,
      zoom: SF.zoom,
      pitch: SF.pitch,
      bearing: SF.bearing,
    });
    mapRef.current = map;

    // Process GeoJSON data for each region.
    const filteredSF = caZip.features
      .filter((feature) => sfZipCodes.includes(feature.properties.ZCTA5CE10))
      .map(assignManualValue);
    const filteredDenver = coZip.features
      .filter((feature) =>
        denverZipCodes.includes(feature.properties.ZCTA5CE10)
      )
      .map(assignManualValue);
    const filteredHonolulu = hiZip.features
      .filter((feature) =>
        honoluluZipCodes.includes(feature.properties.ZCTA5CE10)
      )
      .map(assignManualValue);

    const mergedGeoJSON = {
      type: "FeatureCollection",
      features: [...filteredSF, ...filteredDenver, ...filteredHonolulu],
    };

    map.on("style.load", () => {
      const threeLayer = {
        id: "three-layer",
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          });
        },
        render: function (gl, matrix) {
          const m = new THREE.Matrix4().fromArray(matrix);
          this.camera.projectionMatrix = m;
          this.cube.rotation.y += 0.01;
          this.renderer.state.reset();
          this.renderer.render(this.scene, this.camera);
          map.triggerRepaint();
        },
      };
      map.addLayer(threeLayer, "waterway-label");

      // merged layers (geojson and the extrusions)
      map.addSource("zipcode-extrusions", {
        type: "geojson",
        data: mergedGeoJSON,
      });
      map.addLayer({
        id: "zipcode-extrusions-layer",
        type: "fill-extrusion",
        source: "zipcode-extrusions",
        paint: {
          "fill-extrusion-height": ["coalesce", ["get", "value"], 50],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.8,
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0,
            "#ff8c00",
            200,
            "#ff0080",
          ],
        },
      });
    });

    return () => map.remove();
  }, []);

  // existing flyto logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (inViewSFSection) {
      map.flyTo({
        center: SF.coords,
        zoom: SF.zoom,
        pitch: SF.pitch,
        bearing: SF.bearing,
        speed: 0.5,
      });
    } else if (inViewDenverSection) {
      map.flyTo({
        center: DENVER.coords,
        zoom: DENVER.zoom,
        pitch: DENVER.pitch,
        bearing: DENVER.bearing,
        speed: 0.5,
      });
    } else if (inViewHonoluluSection) {
      map.flyTo({
        center: HONOLULU.coords,
        zoom: HONOLULU.zoom,
        pitch: HONOLULU.pitch,
        bearing: HONOLULU.bearing,
        speed: 0.5,
      });
    }
  }, [inViewSFSection, inViewDenverSection, inViewHonoluluSection]);

  return (
    <div className="scrollytelling-container">
      <div ref={textColumnRef} className="text-column">
        <section ref={refSFSection} className="text-section">
          <h1>San Francisco</h1>
          <p>
            San Francisco’s iconic cool fog and temperate coastal vibes are
            giving way to noticeably warmer days. As you can see here, the
            temperature gradients have shifted, revealing a trend towards higher
            daytime averages. This evolution in the climate not only transforms
            the city’s microclimate but also invites a fresh perspective on
            urban living in a warming coastal environment.
          </p>
        </section>
        <section ref={refDenverSection} className="text-section">
          <h1>Denver</h1>
          <p>
            Denver, famous for its clear skies and crisp mountain air, is
            experiencing a steady climb in temperatures. The map illustrates a
            warming trend across various neighborhoods, echoing a broader change
            in the city’s high-altitude climate. This gradual increase in heat
            is reshaping local lifestyles and prompting discussions on how best
            to adapt to a warmer future.
          </p>
        </section>
        <section ref={refHonoluluSection} className="text-section">
          <h1>Honolulu</h1>
          <p>
            Even in the tropical paradise of Honolulu, familiar warm days are
            intensifying. In this map of the city, subtle but consistent
            increases in temperature mark a shift in a climate that has long
            been a hallmark of island life. This warming trend not only affects
            daily comfort but also serves as a reminder of the evolving
            environmental challenges facing even the most idyllic destinations.
          </p>
        </section>
      </div>
      <div className="map-column">
        <div ref={mapContainerRef} className="map-container" />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="app-container">
      <Scrollytelling />
    </div>
  );
}
