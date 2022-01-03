import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// Awesome :-)
import '@fortawesome/fontawesome-free/js/all.js';

import { baseMaps } from './basemaps.js';

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
let baseMapSetting = 5;

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

const baseLayers = baseMaps.getLayers();

const projection = baseLayers.item(0).get('source').getProjection();

switchBaseMapSetting(baseMapSetting);

const minZoom = 0;
const maxZoom = 19;

const map = new Map({
  layers: [
    baseMaps
  ],
  controls: defaultControls({attribution: false}).extend([new CopyUrlControl(), attribution]),
  target: 'map',
  view: new View({minZoom: minZoom, maxZoom: maxZoom, projection: projection, center: center, zoom: zoom})
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

baseMaps.on('change', function(){ updateURLHash() }); // User selects other basemap

let shouldUpdate = true;
const view = map.getView();

function updateURLHash() {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }
  
  for (let i = 0; i < baseLayers.get('length'); ++i) {
    if (baseLayers.item(i).get('visible')) {
      baseMapSetting = i;
	}
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
  baseLayers.item(bm).set('visible', true);
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