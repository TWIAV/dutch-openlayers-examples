import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';

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
let zoom = 13;

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

const wmsLayer = mapLayers.getLayers().item(0).getLayers().item(0);
const wmsSource = wmsLayer.get('source');
const selLayer = mapLayers.getLayers().item(0).getLayers().item(1);
const selSource = selLayer.get('source');


map.on('pointermove', function (evt) {
  const viewResolution = /** @type {number} */ (map.getView().getResolution());
  if (wmsLayer.get('visible') && viewResolution < 1.80) {
    map.getTargetElement().style.cursor = 'pointer';
	let info = '';
    const url = wmsSource.getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      projection,
      {'INFO_FORMAT': 'application/json; subtype=geojson'}
    );
    if (url) {
      fetch(url)
        .then((response) => response.text())
        .then(function (json) {
          const features = new GeoJSON().readFeatures(json);
          selSource.clear();
          selSource.addFeatures(features);
          if (features.length > 0) {
            info = 'Kadastrale Gemeente: <b>' + features[0].get('kadastraleGemeenteWaarde') + '</b><br>';
            info += 'Perceelnummer: <b>' + features[0].get('AKRKadastraleGemeenteCodeWaarde') + ' ';
            info += features[0].get('sectie') + ' '; 
            info += features[0].get('perceelnummer') + '</b><br>'; 
            info += 'Oppervlakte: <b>' + new Intl.NumberFormat('nll-NL').format(features[0].get('kadastraleGrootteWaarde')) + ' m<sup>2</sup></b>'; 
            tooltip.innerHTML = info;
            overlay.setPosition(evt.coordinate);
          } else {
            overlay.setPosition(undefined);
            map.getTargetElement().style.cursor = '';
          }
        });
    }
  } else {
    selSource.clear();
	overlay.setPosition(undefined);
    map.getTargetElement().style.cursor = '';
  }
});

const instructionDiv = document.createElement('div');
instructionDiv.className = 'ol-instruction-label';
instructionDiv.id = 'instruction';
instructionDiv.innerHTML = '<h3>Information</h3><a href="#" id="instructions-closer" class="ol-popup-closer"></a>'
                         + '<p>In this demo application a WMS layer is shown on top of the basemaps.</p>'
                         + '<p>If you hover over the map a tooltip will be shown with parcel information.</p>';

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