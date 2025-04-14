import React, { useState, useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import { useInView } from "react-intersection-observer";
import DeckGL from "@deck.gl/react";
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl/mapbox";
import "./App.css";
import {
  SF,
  DENVER,
  HONOLULU,
  sfZipCodes,
  denverZipCodes,
  honoluluZipCodes,
} from "./constant-variables";
import { assignManualValue, flyToCity } from "./utils";

// Importing GeoJson zip files for different states
// TODO: Find county level geojson files
import caZip from "./ca_california_zip_codes_geo.min.json";
import coZip from "./co_colorado_zip_codes_geo.min.json"; // Colorado file (for Denver)
import hiZip from "./hi_hawaii_zip_codes_geo.min.json"; // Hawaii file (for Honolulu)

//Add an .env file and load your token from there.
// Mapbox token here
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic3BlbmNtYSIsImEiOiJjbTg5Nm94d28wMnpxMmxteG1ueXRwMTdnIn0.4vub8d3a64SRRTAbkus4Nw";

const Scrollytelling = () => {
  const [initialViewState, setInitialViewState] = useState(SF);

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
  const [mergeData, setMergedData] = useState([]);

  // Ensure the text column starts at the top on mount
  useEffect(() => {
    if (textColumnRef.current) {
      textColumnRef.current.scrollTop = 0;
    }
  }, []);

  //move this outside the App file and use fetch to add the data.
  useEffect(() => {
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
    setMergedData(mergedGeoJSON);
  }, []);

  // useEffect(() => {
  //   // const map = mapRef.current;
  //   // if (!map) return;
  //   // if (inViewSFSection) {
  //   //   map.flyTo({
  //   //     center: SF.coords,
  //   //     zoom: SF.zoom,
  //   //     pitch: SF.pitch,
  //   //     bearing: SF.bearing,
  //   //     speed: 0.5,
  //   //   });
  //   // } else if (inViewDenverSection) {
  //   //   map.flyTo({
  //   //     center: DENVER.coords,
  //   //     zoom: DENVER.zoom,
  //   //     pitch: DENVER.pitch,
  //   //     bearing: DENVER.bearing,
  //   //     speed: 0.5,
  //   //   });
  //   // } else if (inViewHonoluluSection) {
  //   //   map.flyTo({
  //   //     center: HONOLULU.coords,
  //   //     zoom: HONOLULU.zoom,
  //   //     pitch: HONOLULU.pitch,
  //   //     bearing: HONOLULU.bearing,
  //   //     speed: 0.5,
  //   //   });
  //   // }
  // }, [inViewSFSection, inViewDenverSection, inViewHonoluluSection]);

  //call flytocity function from utils
  useEffect(() => {
    if (inViewSFSection) flyToCity(SF, setInitialViewState);
    else if (inViewDenverSection) flyToCity(DENVER, setInitialViewState);
    else if (inViewHonoluluSection) flyToCity(HONOLULU, setInitialViewState);
  }, [inViewSFSection, inViewDenverSection, inViewHonoluluSection]);

  //add map layers
  const layers = [];

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
        <DeckGL layers={layers} initialViewState={initialViewState} controller>
          <Map
            logoPosition="bottom-right"
            attributionControl={false}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          />
        </DeckGL>
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
