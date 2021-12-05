import './style.css';
import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import Projection from 'ol/proj/Projection';
import { getTopLeft } from 'ol/extent';
import {Attribution, defaults as defaultControls} from 'ol/control';

// Elements that make up the popup.
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

// Create an overlay to anchor the popup to the map.
const overlay = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});

// Add a click handler to hide the popup.
// @return {boolean} Don't follow the href.
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

const attribution = new Attribution({
  collapsible: false,
});

// Tiling schema for the Netherlands (Amersfoort / RD New): EPSG:28992
const proj28992Extent = [-285401.92, 22598.08, 595401.92, 903401.92];
const proj28992 = new Projection({ code: 'EPSG:28992', units: 'm', extent: proj28992Extent });
const resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210];
const matrixIds = [];
for (let i = 0; i < 15; ++i) {
  matrixIds[i] = 'EPSG:28992:' + i;
}

const openTopoLayer = new TileLayer({
  title: 'OpenTopo',
  source: new WMTSSource({
    url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts',
    layer: 'opentopo',
    matrixSet: 'EPSG:28992',
    projection: proj28992,
    crossOrigin: 'Anonymous',
    format: 'image/png',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/opentopo" target="_blank" title="Publieke Dienstverlening Op de Kaart">OpenTopo</a>',
    tileGrid: new WMTSTileGrid({
      origin: getTopLeft(proj28992Extent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default'
  })
});

const map = new Map({
  layers: [
    openTopoLayer
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  overlays: [overlay],
  target: 'map',
  view: new View({
    minZoom: 0,
    maxZoom: 15,
    projection: proj28992,
    center: [136848, 455809],
    zoom: 10
  })
});

// Add a click handler to the map to render the popup.
map.on('singleclick', function (evt) {
  const coordinates = evt.coordinate;
  const rdX = Math.round(coordinates[0]);
  const rdY = Math.round(coordinates[1]);
  
  content.innerHTML = '<p><b>Coordinates (RD/EPSG:28992):</b><br>X = ' + rdX + ' / Y = ' + rdY + '</p>';

  fetch('https://geodata.nationaalgeoregister.nl/locatieserver/revgeo?X=' + rdX + '&Y=' + rdY + '&type=adres&distance=20').then(function(response) {
    return response.json();
  }).then(function(json) {
	if (json.response.numFound === 0) {
	  content.innerHTML += '<p><b>Adress:</b><br>No address found at this location</p>';
	} else {
	  content.innerHTML += '<p><b>Adress:</b><br>' + json.response.docs[0].weergavenaam + '</p>';
	}
	overlay.setPosition(coordinates);
  })
});