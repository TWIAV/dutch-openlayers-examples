import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
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

// Awesome :-)
import '@fortawesome/fontawesome-free/js/all.js';

import convertToGrayScale from './convert-to-grayscale.js';

// Define copy url control
class CopyUrlControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<i class=\'fas fa-link\'></i>';

    const element = document.createElement('div');
    element.className = 'copy-url ol-unselectable ol-control';
	element.title = 'Copy URL of this map to clipboard';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleCopyUrl.bind(this), false);
  }

  handleCopyUrl() {
    const inputc = document.body.appendChild(document.createElement("input"));
    inputc.value = window.location.href;
    inputc.focus();
    inputc.select();
    document.execCommand('copy');
    alert("URL of the map copied to clipboard:\n" + inputc.value);
    inputc.parentNode.removeChild(inputc);
  }
}

const attribution = new Attribution({
  collapsible: false,
});

let center = [155000, 463000];
let zoom = 3;
let baseMapSetting = 0;

if (window.location.hash !== '') {
  // try to restore center and zoom-level from the URL
  const hash = window.location.hash.replace('#map=', '');
  const parts = hash.split('/');
  if (parts.length === 4) {
    zoom = parseFloat(parts[0]);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
    baseMapSetting = parseFloat(parts[3]);
  }
}

// Tiling schema for the Netherlands (Amersfoort / RD New): EPSG:28992
const proj28992Extent = [-285401.92, 22598.08, 595401.92, 903401.92];
const proj28992 = new Projection({ code: 'EPSG:28992', units: 'm', extent: proj28992Extent });
const resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210, 0.105, 0.0525, 0.02625, 0.013125, 0.0065625];
const matrixIds = [];
for (let i = 0; i < 20; ++i) {
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
  minResolution: 0.200,
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
  minResolution: 0.200,
  visible: false,
  source: new WMTSSource({
    url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts',
    layer: 'opentopoachtergrondkaart',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/opentopo" target="_blank" title="Publieke Dienstverlening Op de Kaart">OpenTopo Achtergrondkaart</a>'
  })
});

// add a grayscale layer
let openTopoAchtergrondkaartGrijsLayer = new TileLayer(openTopoAchtergrondkaartLayer.getProperties());

openTopoAchtergrondkaartGrijsLayer.set('title', 'OpenTopo Achtergrond (grijs)');

openTopoAchtergrondkaartGrijsLayer.on('postrender', function(event) {
  convertToGrayScale(event.context);
});

const brtAchtergrondkaartLayer = new TileLayer({
  title: 'BRT Achtergrondkaart',
  type: 'base',
  minResolution: 0.200,
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0',
    layer: 'standaard',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-topografie-achtergrondkaarten-brt-a-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BRT Achtergrondkaart</a>'
  })
});

const luchtfotoActueelOrtho25cmRGBLayer = new TileLayer({
  title: 'Luchtfoto (actueel / 25 cm)',
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
  title: 'Luchtfoto (actueel / 7,5 cm)',
  type: 'base',
  visible: false,
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: 'Actueel_orthoHR',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/luchtfoto-pdok" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto (7,5 cm)</a>'
  })
});

switchBaseMapSetting(baseMapSetting);

const baseMaps = new LayerGroup({
  title: 'Basemaps',
  fold: 'open',
  layers: [luchtfotoActueelOrthoHRRGBLayer, luchtfotoActueelOrtho25cmRGBLayer, brtAchtergrondkaartLayer, openTopoAchtergrondkaartGrijsLayer, openTopoAchtergrondkaartLayer, openTopoLayer]
});

const minZoom = 0;
const maxZoom = 19;

const map = new Map({
  layers: [
    baseMaps
  ],
  controls: defaultControls({attribution: false}).extend([new CopyUrlControl(), attribution]),
  target: 'map',
  view: new View({minZoom: minZoom, maxZoom: maxZoom, projection: proj28992, center: center, zoom: zoom})
})

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Layer list', // Optional label for button
  collapseTipLabel: 'Hide layer list',
  groupSelectStyle: 'children' // Can be 'children' [default], 'group' or 'none'
});

map.addControl(layerSwitcher);

map.on ('moveend', handleZoomBtnsAndLayerSwitcher);

function handleZoomBtnsAndLayerSwitcher(evt) {
  const zoomLevel = Math.round(map.getView().getZoom());
  const zoomInBtn = document.querySelector(".ol-zoom-in");
  const zoomOutBtn = document.querySelector(".ol-zoom-out");
  // Gray out zoom buttons at maximum and minimum zoom respectively
  zoomLevel === maxZoom ? zoomInBtn.style.backgroundColor = "rgba(0,60,136,0.1)" : zoomInBtn.style.backgroundColor = "rgba(0,60,136,0.5)";
  zoomLevel === minZoom ? zoomOutBtn.style.backgroundColor = "rgba(0,60,136,0.1)" : zoomOutBtn.style.backgroundColor = "rgba(0,60,136,0.5)";
  // Make sure the layer switcher is rerendered to set the color (gray or black) for layer titles, depending on their visibility at a certain zoomlevel
  layerSwitcher.renderPanel();
}

openTopoLayer.on('change:visible', function(){ updateURLHash() });
openTopoAchtergrondkaartLayer.on('change:visible', function(){ updateURLHash() });
brtAchtergrondkaartLayer.on('change:visible', function(){ updateURLHash() });
luchtfotoActueelOrtho25cmRGBLayer.on('change:visible', function(){ updateURLHash() });
luchtfotoActueelOrthoHRRGBLayer.on('change:visible', function(){ updateURLHash() });

let shouldUpdate = true;
const view = map.getView();

function updateURLHash() {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }

  if (openTopoLayer.get('visible')) {
    baseMapSetting = 0;
  } else if (openTopoAchtergrondkaartLayer.get('visible')) {
    baseMapSetting = 1;
  } else if (brtAchtergrondkaartLayer.get('visible')) {
    baseMapSetting = 2;
  } else if (luchtfotoActueelOrtho25cmRGBLayer.get('visible')) {
    baseMapSetting = 3;
  } else if (luchtfotoActueelOrthoHRRGBLayer.get('visible')) {
    baseMapSetting = 4;
  } else if (openTopoAchtergrondkaartGrijsLayer.get('visible')) {
    baseMapSetting = 5;
  } else {
    baseMapSetting = 0;
  }

  const center = view.getCenter();
  const hash =
    '#map=' +
    Math.round(view.getZoom()) +
    '/' +
    Math.round(center[0]) +
    '/' +
    Math.round(center[1]) +
	'/' +
	baseMapSetting
  const state = {
    zoom: view.getZoom(),
    center: view.getCenter()
  };
  window.history.pushState(state, 'map', hash);
};

map.on('moveend', updateURLHash);

// restore the view state when navigating through the history, see
// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
window.addEventListener('popstate', function (event) {
  if (event.state === null) {
    return;
  }
  map.getView().setCenter(event.state.center);
  map.getView().setZoom(event.state.zoom);
  shouldUpdate = false;
});

function switchBaseMapSetting(bm) {
  switch(bm) {
    case 0:
      openTopoLayer.set('visible', true);
      break;
    case 1:
      openTopoAchtergrondkaartLayer.set('visible', true);
      break;
    case 2:
      brtAchtergrondkaartLayer.set('visible', true);
      break;
    case 3:
      luchtfotoActueelOrtho25cmRGBLayer.set('visible', true);
      break;
    case 4:
      luchtfotoActueelOrthoHRRGBLayer.set('visible', true);
      break;
    case 5:
      openTopoAchtergrondkaartGrijsLayer.set('visible', true);
      break;
  };
}

const instructionDiv = document.createElement('div');
instructionDiv.className = 'ol-instruction-label';
instructionDiv.id = 'instruction';
instructionDiv.innerHTML = '<h3>Instructions</h3><a href="#" id="instructions-closer" class="ol-popup-closer"></a>'
                         + '<p>While panning and zooming around on the map, the URL will be constantly updated. And the current basemap is also stored in there.</p>'
                         + '<p>Click the link button <button style="background-color:rgba(0,60,136,0.5);border:white">'
                         + '<i class=\'fas fa-link\' style="color:white"></i></button> above to copy the URL to your clipboard, allowing you to retain the map state.</p>';

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