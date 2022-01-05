import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';
import {Fill, Stroke, Style} from 'ol/style';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

import { baseMaps } from './basemaps.js';
import { mapLayers } from './layers.js';

// tooltip element
const tooltip = document.getElementById('tooltip');

// Create an overlay to anchor the popup to the map.
const overlay = new Overlay({
  element: tooltip,
  offset: [10, 0],
  positioning: 'bottom-left'
});

const attribution = new Attribution({
  collapsible: false,
});

let center = [155000, 463000];
let zoom = 3;

baseMaps.set('fold', 'close');

const projection = baseMaps.getLayers().item(0).get('source').getProjection();

baseMaps.getLayers().item(3).set('visible', true);

const minZoom = 0;
const maxZoom = 19;

const map = new Map({
  layers: [
    baseMaps,
    mapLayers
  ],
  overlays: [overlay],
  controls: defaultControls({attribution: false}).extend([attribution]),
  target: 'map',
  view: new View({minZoom: minZoom, maxZoom: maxZoom, projection: projection, center: center, zoom: zoom})
})

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Layer list', // Optional label for button
  collapseTipLabel: 'Hide layer list',
  groupSelectStyle: 'group' // Can be 'children' [default], 'group' or 'none' - groups have a checkbox but do not alter child visibility (like QGIS)
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

const auMunicipalitiesHighlightStyle = new Style({
  fill: new Fill({color: 'rgba(41, 128, 185, 0.5)'}),
  stroke: new Stroke({color: 'rgba(41, 128, 185, 1)', width: 1.5})
});

const auProvincesHighlightStyle = new Style({
  fill: new Fill({color: 'rgba(169, 50, 38, 0.3)'}),
  stroke: new Stroke({color: 'rgba(169, 50, 38, 1)', width: 2})
});

let munSelected = [];
let provSelected = [];

map.on('pointermove', function(evt){
  let info = '';
  for (let i = 0; i < munSelected.length; i++) { munSelected[i].setStyle(undefined); munSelected.splice(i,1); }
  for (let i = 0; i < provSelected.length; i++) { provSelected[i].setStyle(undefined); provSelected.splice(i,1); }
  map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
	const layerTitle = layer.get('title');
    if (feature &&  layerTitle === 'Provinces') {
      info += 'Province: <b>' + feature.get('provincienaam') + '</b><br>';
	  const prov = feature;
	  provSelected.push(prov);
	  feature.setStyle(auProvincesHighlightStyle);
	}
    if (feature &&  layerTitle === 'Municipalities') {
      info += 'Municipality: <b>' + feature.get('gemeentenaam') + '</b><br>';
	  const mun = feature;
	  munSelected.push(mun);
	  feature.setStyle(auMunicipalitiesHighlightStyle);
	}
  });
  tooltip.innerHTML = info;
  if (info.length > 0) {
    overlay.setPosition(evt.coordinate);
  } else {
      overlay.setPosition(undefined);
  }
});

map.on('pointermove', function(e) {
  if (e.dragging) return;
     
  var pixel = map.getEventPixel(e.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);
  
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

const instructionDiv = document.createElement('div');
instructionDiv.className = 'ol-instruction-label';
instructionDiv.id = 'instruction';
instructionDiv.innerHTML = '<h3>Information</h3><a href="#" id="instructions-closer" class="ol-popup-closer"></a>'
                         + '<p>In this demo application two vector layers, with data coming from a WFS service, are shown on top of the basemaps.</p>'
                         + '<p>If you hover over the map a tooltip will be shown with the name of the province and the municipality.</p>';

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