import 'autocompleter/autocomplete.css';
import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import './ol-about-dialog.css';

import {Map, View} from 'ol';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import WKT from 'ol/format/WKT';
import GeoJSON from 'ol/format/GeoJSON';
import LayerGroup from 'ol/layer/Group';
import {Circle as CircleStyle, Stroke, Style} from 'ol/style';
import * as olExtent from 'ol/extent';
import FullScreen from 'ol/control/FullScreen';
import ZoomToExtent from 'ol/control/ZoomToExtent';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// ol-ext is a set of extensions, controls, interactions, popup to use with Openlayers, by Jean-Marc Viglino, Software Engineer at IGN-France
// https://github.com/Viglino/ol-ext
import Swipe from 'ol-ext/control/Swipe';
import 'ol-ext/control/Swipe.css';

import Bar from 'ol-ext/control/Bar';
import 'ol-ext/control/Bar.css';

// Awesome :-)
import '@fortawesome/fontawesome-free/js/all.js';

// Blazing fast and lightweight autocomplete library - https://kraaden.github.io/autocomplete/
import autocomplete from 'autocompleter';

import { baseMapLayerGroup, inundationLayerGroup, swipeLayerGroup } from './wmtslayers.js';
import { dkkLayerGroup } from './wmslayers.js';

import { createAboutDialog } from './ol-about-dialog.js';
import { aboutDialogTxt } from './about-dialog-text.js';

createAboutDialog(aboutDialogTxt[0], aboutDialogTxt[1], aboutDialogTxt[2], aboutDialogTxt[3]);

const aboutDialog = document.getElementById('aboutDialog');
aboutDialog.style.display = "none";    

const mapLayerGroup = new LayerGroup({
  title: 'Kaartlagen',
  fold: 'open',
  layers: [inundationLayerGroup, swipeLayerGroup, dkkLayerGroup]
});

// Reverse geocoding
let reverseGeocoding = false;
let addressFound;
let coordinatesClicked;

// Define reverse geocoding control
class revGeoControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<i class=\'fas fas fa-flag-checkered\'></i>';
	button.id = 'revGeoButton';

    const element = document.createElement('div');
    element.className = 'rev-geo ol-unselectable ol-control';
	element.title = 'Klik op kaart voor adres\n en coördinaten';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleRevGeoButton.bind(this), false);
  }

  handleRevGeoButton() {
	const button = document.getElementById('revGeoButton');
    if (reverseGeocoding) {
      button.style.color = 'white';
	  button.style.backgroundColor = 'rgba(0,60,136,0.5)';
	  map.getViewport().style.cursor = 'auto';
      addressPopup.setPosition(undefined);
	  reverseGeocoding = false;
	} else {
      button.style.color = 'rgba(0,60,136,0.5)';
	  button.style.backgroundColor = 'white';
      reverseGeocoding = true;
	  map.getViewport().style.cursor = 'crosshair';
	}
  }
}

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
const header = document.getElementById('popup-header');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');
const copyAddressBtn = document.getElementById('copy-address-button');
copyAddressBtn.innerHTML = '<i class="fas fa-copy"></i>';
copyAddressBtn.title = 'Kopiëer adres';
const copyCoordinatesBtn = document.getElementById('copy-coordinates-button');
copyCoordinatesBtn.innerHTML = '<i class="fas fa-map-marked-alt"></i>';
copyCoordinatesBtn.title = 'Kopiëer coördinaten';

copyAddressBtn.addEventListener('click', copyAddressToClipboard);

copyCoordinatesBtn.addEventListener('click', copyCoordinatesToClipboard);

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
  copyAddressBtn.style.display = "none";
  copyCoordinatesBtn.style.display = "none";
  addressVectorSource.clear(); // remove address search result from map
  document.getElementById('input-loc').value = ''; // clear address search bar
  closer.blur();
  return false;
};

// tooltip element
const tooltipElement = document.getElementById('tooltip');

// Create an overlay to anchor the tooltip to the map.
const tooltipOverlay = new Overlay({
  element: tooltip,
  offset: [18, 0],
  positioning: 'center-left'
});

// Define copy url control
class CopyUrlControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<i class=\'fas fa-link\'></i>';
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control';
	element.title = 'Kopieer het adres (URL) van deze kaart';
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
    alert('URL kaart naar klembord gekopieerd:\n' + inputc.value);
    inputc.parentNode.removeChild(inputc);
  }
}

const attribution = new Attribution({
  collapsible: false,
});

let center = [183565, 368613];
let zoom = 4;
let baseMapSetting = 3;

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

const baseMapLayers = baseMapLayerGroup.getLayers();

const projection = baseMapLayers.item(0).get('source').getProjection();

switchBaseMapSetting(baseMapSetting);

const minZoom = 0;
const maxZoom = 19;

const map = new Map({
  layers: [
    baseMapLayerGroup,
	mapLayerGroup,
	addressVectorLayer
  ],
  controls: defaultControls({attribution: false}).extend([attribution]),
  overlays: [addressPopup, tooltipOverlay],
  target: 'map',
  view: new View({minZoom: minZoom, maxZoom: maxZoom, projection: projection, center: center, zoom: zoom})
})

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Lijst met lagen',
  collapseTipLabel: 'Verberg lijst met lagen',
  groupSelectStyle: 'group'
});

map.addControl(layerSwitcher);

map.on ('moveend', manageControls);

function manageControls(evt) {
  const zoomLevel = Math.round(map.getView().getZoom());
  const zoomInBtn = document.querySelector(".ol-zoom-in");
  const zoomOutBtn = document.querySelector(".ol-zoom-out");
  zoomOutBtn.title = 'Zoom uit';
  const swipeBtn = document.querySelector(".ol-swipe");
  if (swipeBtn !== null) swipeBtn.title = 'Schuiven om te vergelijken';
  const rotateBtn = document.querySelector(".ol-rotate-reset");
  rotateBtn.title = 'Draai de kaart weer naar het noorden';
  const zoomToExtentBtn = document.querySelector(".ol-zoom-extent");
  zoomToExtentBtn.firstChild.title = 'Zoom naar startpositie kaart';
  zoomToExtentBtn.firstChild.innerHTML = '&#8962';
  const fullScreenOpenBtn = document.querySelector(".ol-full-screen-false");
  if (fullScreenOpenBtn !== null) fullScreenOpenBtn.title = 'Volledig scherm openen';
  const fullScreenCloseBtn = document.querySelector(".ol-full-screen-true");
  if (fullScreenCloseBtn !== null) fullScreenCloseBtn.title = 'Volledig scherm sluiten';
  // Gray out zoom buttons at maximum and minimum zoom respectively
  zoomLevel === maxZoom ? zoomInBtn.style.backgroundColor = "rgba(0,60,136,0.1)" : zoomInBtn.style.backgroundColor = "rgba(0,60,136,0.5)";
  zoomLevel === minZoom ? zoomOutBtn.style.backgroundColor = "rgba(0,60,136,0.1)" : zoomOutBtn.style.backgroundColor = "rgba(0,60,136,0.5)";
  // Make sure the layer switcher is rerendered to set the color (gray or black) for layer titles, depending on their visibility at a certain zoomlevel
  layerSwitcher.renderPanel();
}

baseMapLayerGroup.on('change', function(){ updateURLHash() }); // User selects other basemap

// Swipe Control
// const swipeLayerGroup = mapLayerGroup.getLayers().item(1);
const swipeLayer = swipeLayerGroup.getLayers().item(0);

var swipe = new Swipe({position: 0.50});
map.addControl(swipe);
swipe.addLayer(swipeLayer, true);

// Remove Swipe Control when the swipe layer is not visible
mapLayerGroup.on('change', function() {
  mapLayerGroup.get('visible') && swipeLayerGroup.get('visible') && swipeLayer.get('visible') ? map.addControl(swipe) : map.removeControl(swipe);
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
	input.placeholder = 'Zoek adres in Nederland';
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

// Toolbar
const toolBar = new Bar();
map.addControl(toolBar);
toolBar.setPosition('top-left');

toolBar.addControl(new CopyUrlControl());
toolBar.addControl(new revGeoControl());
toolBar.addControl(new ZoomToExtent({ extent: [22822.599999999977, 271952.52, 344307.4, 465273.48]}));
toolBar.addControl(new FullScreen());

let shouldUpdate = true;
const view = map.getView();

function updateURLHash() {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }
  
  for (let i = 0; i < baseMapLayers.get('length'); ++i) {
    if (baseMapLayers.item(i).get('visible')) {
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
  baseMapLayers.item(bm).set('visible', true);
}

// Define show about dialog control
class ShowAboutDialogControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '?';
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control';
	element.title = 'Over deze applicatie';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleShowAboutDialog.bind(this), false);
  }

  handleShowAboutDialog() {
    aboutDialog.style.display = "block";
  }
}

// Add a click handler to the map to reverse geocode
map.on('singleclick', function (evt) {
  if (reverseGeocoding) { // Only retrieve address when revGeoButton is activated
    header.innerHTML = '<b>Gekozen locatie</b>';
    copyAddressBtn.style.display = "block";
    copyCoordinatesBtn.style.display = "block";
    const rdCoordinates = evt.coordinate;
    const rdX = Math.round(rdCoordinates[0]);
    const rdY = Math.round(rdCoordinates[1]);
	coordinatesClicked = 'X = ' + rdX + ' / Y = ' + rdY;
    
    content.innerHTML = '<p><b>RD-coördinaten (EPSG:28992):</b><br>' + coordinatesClicked + '</p>';

    fetch('https://geodata.nationaalgeoregister.nl/locatieserver/revgeo?X=' + rdX + '&Y=' + rdY + '&type=adres&distance=20').then(function(response) {
      return response.json();
    }).then(function(json) {
      if (json.response.numFound === 0) {
        content.innerHTML += '<p><b>Adres:</b><br>Er is geen adres gevonden voor deze locatie</p>';
      } else {
		addressFound = json.response.docs[0].weergavenaam;
        content.innerHTML += '<p><b>Adres:</b><br>' + addressFound + '</p>';
      }
      addressPopup.setPosition(rdCoordinates);
    })
  }
});

function copyAddressToClipboard(text) {
  const inputc = document.body.appendChild(document.createElement("input"));
  inputc.value = addressFound;
  inputc.focus();
  inputc.select();
  document.execCommand('copy');
  if (addressFound.length > 0) {
    alert("Adres naar klembord gekopieerd:\n" + inputc.value);
  }
  inputc.parentNode.removeChild(inputc);
}

function copyCoordinatesToClipboard(text) {
  const inputc = document.body.appendChild(document.createElement("input"));
  inputc.value = coordinatesClicked;
  inputc.focus();
  inputc.select();
  document.execCommand('copy');
  alert("Coördinaten naar klembord gekopieerd:\n" + inputc.value);
  inputc.parentNode.removeChild(inputc);
}

// Parcel tooltip and highlighting
const parcelLayer = dkkLayerGroup.getLayers().item(0);
const parcelSource = parcelLayer.get('source');
const selectedParcelLayer = dkkLayerGroup.getLayers().item(1);
const selectedParcelSource = selectedParcelLayer.get('source');


map.on('click', function (evt) {
  const viewResolution = /** @type {number} */ (map.getView().getResolution());
  if (parcelLayer.get('visible') && viewResolution < 1.80) {
    map.getTargetElement().style.cursor = 'pointer';
	let info = '';
    const url = parcelSource.getFeatureInfoUrl(
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
          selectedParcelSource.clear();
          selectedParcelSource.addFeatures(features);
          if (features.length > 0) {
            info = 'Kadastrale Gemeente: <b>' + features[0].get('kadastraleGemeenteWaarde') + '</b><br>';
            info += 'Perceelnummer: <b>' + features[0].get('AKRKadastraleGemeenteCodeWaarde') + ' ';
            info += features[0].get('sectie') + ' '; 
            info += features[0].get('perceelnummer') + '</b><br>'; 
            info += 'Oppervlakte: <b>' + new Intl.NumberFormat('nll-NL').format(features[0].get('kadastraleGrootteWaarde')) + ' m<sup>2</sup></b>'; 
            tooltip.innerHTML = info;
            tooltipOverlay.setPosition(evt.coordinate);
          } else {
            tooltipOverlay.setPosition(undefined);
            map.getTargetElement().style.cursor = '';
          }
        });
    }
  } else {
    selectedParcelSource.clear();
	tooltipOverlay.setPosition(undefined);
    map.getTargetElement().style.cursor = '';
  }
});

// Toolbar About Dialog
const toolBarAboutDialog = new Bar();
map.addControl(toolBarAboutDialog);
toolBarAboutDialog.setPosition('bottom-left');

toolBarAboutDialog.addControl(new ShowAboutDialogControl());