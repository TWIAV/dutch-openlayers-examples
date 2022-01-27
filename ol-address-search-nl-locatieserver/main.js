import 'autocompleter/autocomplete.css';
import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import WKT from 'ol/format/WKT';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';
import {Circle as CircleStyle, Stroke, Style} from 'ol/style';
import * as olExtent from 'ol/extent';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// Blazing fast and lightweight autocomplete library - https://kraaden.github.io/autocomplete/
import autocomplete from 'autocompleter';

import { baseMaps } from './basemaps.js';

// layer to show address search result
const addressVectorSource = new VectorSource();

const redLine = new Stroke({
  color: [255, 0, 0, 0.8],
  width: 4
});

const addressVectorLayer = new VectorLayer({
  source: addressVectorSource,
  declutter: true,
  style: [new Style({stroke: redLine}), new Style({image: new CircleStyle({radius: 6, stroke: redLine})})]
});

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

function newSearch() {
  addressPopup.setPosition(undefined);
  addressVectorSource.clear(); // remove address search result from map
  document.getElementById('input-loc').value = ''; // clear address search bar
  document.getElementById("input-loc").focus();
  closer.blur();
  return false;
};

function KeyPress(e) {
  var evtobj = window.event ? event : e
  if (evtobj.shiftKey && evtobj.which === 38) newSearch()
}

document.onkeydown = KeyPress;

// Add a click handler to hide the popup.
closer.onclick = newSearch;

const attribution = new Attribution({
  collapsible: false,
});

let center = [155000, 463000];
let zoom = 3;

const projection = baseMaps.getLayers().item(0).get('source').getProjection();

baseMaps.getLayers().item(4).set('visible', true);

const minZoom = 0;
const maxZoom = 19;

const map = new Map({
  layers: [
    baseMaps,
    addressVectorLayer
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  overlays: [addressPopup],
  target: 'map',
  view: new View({minZoom: minZoom, maxZoom: maxZoom, projection: projection, center: center, zoom: zoom})
})

// Using the PDOK Location Server --> https://pdok.github.io/webservices-workshop/#using-the-pdok-location-server
// Adding Custom Control

const locatieServerUrl = 'https://geodata.nationaalgeoregister.nl/locatieserver/v3';

var LocationServerControl = /* @__PURE__ */(function (Control) {
  function LocationServerControl (optOptions) {
    var options = optOptions || {};
    var input = document.createElement('input');
    input.id = 'input-loc';
	input.spellcheck = false;
	input.placeholder = 'Search address (Netherlands only)';
    var element = document.createElement('div');
    element.className = 'input-loc ol-unselectable ol-control';
	element.id = 'addressSearchBar';
    element.appendChild(input);
    Control.call(this, {
      element: element,
      target: options.target
    })
    // suggest - Get Suggestions from Locatie Server
    autocomplete({
      input: input,
      fetch: function (text, update) {
        fetch(`${locatieServerUrl}/suggest?q=${text}`)
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            const suggestions = [];
            data.response.docs.forEach(function (item) {
              const name = item.weergavenaam;
              const id = item.id;
              suggestions.push({ label: name, value: id });
            })
            update(suggestions)
          })
      },
	  // lookup - Get Result from Locatie Server
	  onSelect: function (item) {
        input.value = item.label;
        const id = item.value;
        fetch(`${locatieServerUrl}/lookup?id=${id}&fl=id,weergavenaam,geometrie_rd`)
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            let coord;
			let padding = [0,0,0,0];
            const wktLoc = data.response.docs[0].geometrie_rd;
            const format = new WKT();
            const feature = format.readFeature(wktLoc);
			addressVectorSource.clear();
            addressVectorSource.addFeature(feature);
            const ext = feature.getGeometry().getExtent();
			const geomType = feature.getGeometry().getType();
            if (geomType === 'Point') {
              coord = feature.getGeometry().getCoordinates();
            } else {
              coord = olExtent.getCenter(ext);
			  padding = [60,60,60,60];
            }
            const address = data.response.docs[0].weergavenaam;
            content.innerHTML = '<p>' + address + '</p>';
            addressPopup.setPosition(coord);
            map.getView().fit(ext, {size: map.getSize(), padding: padding, maxZoom: 14});
          })
      }
    })
  }
  if (Control) LocationServerControl.__proto__ = Control
  LocationServerControl.prototype = Object.create(Control && Control.prototype)
  LocationServerControl.prototype.constructor = LocationServerControl
  return LocationServerControl
}(Control))

map.addControl(new LocationServerControl())

// The address search bar is sharing the upper right corner of
// the map with the default OpenLayers rotate button, which is
// hidden when map rotation = 0. That's why the address search
// bar gives way to the rotate button when the map is rotated

const lsControl = document.getElementById('addressSearchBar');

map.getView().on('change:rotation', function() {
  let rotation = map.getView().getRotation();
  if (rotation === 0) {
    lsControl.className = 'visible'
  } else {
    lsControl.className = 'invisible'
  }
});

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Layer list',
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

const instructionDiv = document.createElement('div');
instructionDiv.className = 'ol-instruction-label';
instructionDiv.id = 'instruction';
instructionDiv.innerHTML = '<h3>Information</h3><a href="#" id="instructions-closer" class="ol-popup-closer"></a>'
                         + '<p>This demo application shows the implemantation of an address search bar (in the upper right corner of the map).</p>'
                         + '<p>Adresses are searched usint the <a href="https://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=amsterdam" target="_blank">'
						 + 'Dutch \'Locatieserver\'</a>.</p><p>So, only addresses in the Netherlands will be found.</p>'
						 + '<p>Quick search tip:<br>Do you have a keyboard at hand? Press Shift + Arrow Up to put focus on the search bar.</p>';
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