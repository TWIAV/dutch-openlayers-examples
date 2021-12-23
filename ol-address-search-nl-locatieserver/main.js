import 'autocompleter/autocomplete.css';
import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import WKT from 'ol/format/WKT';
import Projection from 'ol/proj/Projection';
import { getTopLeft } from 'ol/extent';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';
import {Circle as CircleStyle, Stroke, Style} from 'ol/style';
import * as olExtent from 'ol/extent';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// Blazing fast and lightweight autocomplete library - https://kraaden.github.io/autocomplete/
import autocomplete from 'autocompleter';

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

// Add a click handler to hide the popup.
// @return {boolean} Don't follow the href.
closer.onclick = function () {
  addressPopup.setPosition(undefined);
  addressVectorSource.clear(); // remove address search result from map
  document.getElementById('input-loc').value = ''; // clear address search bar
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
    baseMaps,
    addressVectorLayer
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  overlays: [addressPopup],
  target: 'map',
  view: new View({minZoom: 0, maxZoom: 15, projection: proj28992, center: center, zoom: zoom})
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
			console.log(geomType);
            if (geomType === 'Point') {
              coord = feature.getGeometry().getCoordinates();
            } else {
              coord = olExtent.getCenter(ext);
			  padding = [60,60,60,60];
            }
            const address = data.response.docs[0].weergavenaam;
            content.innerHTML = '<p>' + address + '</p>';
            addressPopup.setPosition(coord);
            map.getView().fit(ext, {size: map.getSize(), padding: padding});
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