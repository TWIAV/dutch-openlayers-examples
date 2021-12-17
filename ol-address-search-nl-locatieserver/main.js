import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import Projection from 'ol/proj/Projection';
import { getTopLeft } from 'ol/extent';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// the address search bar control
import LocationServerControl from './locatie-server-control';

// Elements that make up the popup.
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

// Create an overlay to anchor the popup to the map.
const addressPopup = new Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});

// Add a click handler to hide the popup.
// @return {boolean} Don't follow the href.
closer.onclick = function () {
  addressPopup.setPosition(undefined);
  closer.blur();
  return false;
};

const attribution = new Attribution({
  collapsible: false,
});

let center = [155000, 463000];
let zoom = 3;

// Tiling schema for the Netherlands (Amersfoort / RD New): EPSG:28992
const proj28992Extent = [-285401.92, 22598.08, 595401.92, 903401.92];
const proj28992 = new Projection({ code: 'EPSG:28992', units: 'm', extent: proj28992Extent });
const resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210];
const matrixIds = [];
for (let i = 0; i < 15; ++i) {
  matrixIds[i] = 'EPSG:28992:' + i;
}

const dutchWMTSTileGrid = new WMTSTileGrid({
  origin: getTopLeft(proj28992Extent),
  resolutions: resolutions,
  matrixIds: matrixIds
});

const openTopoLayer = new TileLayer({
  title: 'OpenTopo',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts',
    layer: 'opentopo',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/opentopo" target="_blank" title="Publieke Dienstverlening Op de Kaart">OpenTopo</a>'
  })
});

const openTopoAchtergrondkaartLayer = new TileLayer({
  title: 'OpenTopo Achtergrondkaart',
  type: 'base',
  visible: true,
  source: new WMTSSource({
    url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts',
    layer: 'opentopoachtergrondkaart',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/opentopo" target="_blank" title="Publieke Dienstverlening Op de Kaart">OpenTopo Achtergrondkaart</a>'
  })
});

const brtAchtergrondkaartLayer = new TileLayer({
  title: 'BRT Achtergrondkaart',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0',
    layer: 'standaard',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-topografie-achtergrondkaarten-brt-a-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BRT Achtergrondkaart</a>'
  })
});

const luchtfotoActueelOrtho25cmRGBLayer = new TileLayer({
  title: 'Luctfoto (actueel / 25 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_ortho25',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/luchtfoto-pdok" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto (25 cm)</a>'
  })
});

const luchtfotoActueelOrthoHRRGBLayer = new TileLayer({
  title: 'Luctfoto (actueel / 7,5 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_orthoHR',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/luchtfoto-pdok" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto (7,5 cm)</a>'
  })
});

const baseMaps = new LayerGroup({
	title: 'Basemaps',
	fold: 'open',
	layers: [luchtfotoActueelOrthoHRRGBLayer, luchtfotoActueelOrtho25cmRGBLayer, brtAchtergrondkaartLayer, openTopoAchtergrondkaartLayer, openTopoLayer]
});

const map = new Map({
  layers: [
    baseMaps
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  overlays: [addressPopup],
  target: 'map',
  view: new View({minZoom: 0, maxZoom: 15, projection: proj28992, center: center, zoom: zoom})
})

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Layer list',
  collapseTipLabel: 'Hide layer list',
  groupSelectStyle: 'children' // Can be 'children' [default], 'group' or 'none'
});

map.addControl(layerSwitcher);

function locationSelectedHandler(event) {
  const coordinates = event.detail.coordinate;
  content.innerHTML = '<p>' + event.detail.result + '</p>';
  addressPopup.setPosition(coordinates);
  map.getView().fit(event.detail.extent, { maxZoom: 18 })
}

function addLsInput () {
  let myControl = new Control({ element: lsControl })
  map.addControl(myControl)
  lsControl.addEventListener('location-selected', locationSelectedHandler, false)
}

customElements.define('locatieserver-control', LocationServerControl)
const lsControl = document.createElement('locatieserver-control')

addLsInput()

// The address search bar is sharing the upper right corner of
// the map with the default OpenLayers rotate button, which is
// hidden when map rotation = 0. That's why the address search
// bar gives way to the rotate button when the map is rotated
map.getView().on('change:rotation', function() {
  let rotation = map.getView().getRotation();
  if (rotation === 0) {
    lsControl.className = 'visible'
  } else {
    lsControl.className = 'invisible'
  }
});

const instructionDiv = document.createElement('div');
instructionDiv.className = 'ol-instruction-label';
instructionDiv.id = 'instruction';
instructionDiv.innerHTML = '<h3>Information</h3><a href="#" id="instructions-closer" class="ol-popup-closer"></a>'
                         + '<p>This demo application shows the implemantation of an address search bar (in the upper right corner of the map).</p>'
                         + '<p>Adresses are searched usint the <a href="https://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=amsterdam" target="_blank">'
						 + 'Dutch \'Locatieserver\'</a>.</p><p>So, only addresses in the Netherlands will be found.</p>';
const instructions = new Control({element: instructionDiv});

map.addControl(instructions);

const closeInstructions = document.getElementById('instructions-closer');

// Add a click handler to remove the Instructions.
// @return {boolean} Don't follow the href.
closeInstructions.onclick = function () {
  map.removeControl(instructions);
  closeInstructions.blur();
  return false;
};