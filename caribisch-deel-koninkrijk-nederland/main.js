import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import './ol-about-dialog.css';

import {Map, View} from 'ol';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import BingMaps from 'ol/source/BingMaps';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';
import {Fill, Stroke, Style} from 'ol/style';
import FullScreen from 'ol/control/FullScreen';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import {Attribution, Rotate, defaults as defaultControls} from 'ol/control';
import Control from 'ol/control/Control';

// OpenLayers LayerSwitcher by Matt Walker - https://github.com/walkermatt/ol-layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

// ol-ext is a set of extensions, controls, interactions, popup to use with Openlayers, by Jean-Marc Viglino, Software Engineer at IGN-France
// https://github.com/Viglino/ol-ext
import Bar from 'ol-ext/control/Bar';
import 'ol-ext/control/Bar.css';

import GeoBookmark from 'ol-ext/control/GeoBookmark';
import 'ol-ext/control/GeoBookmark.css';

import { createAboutDialog } from './ol-about-dialog.js';
import { aboutDialogTxt } from './about-dialog-text.js';

createAboutDialog(aboutDialogTxt[0], aboutDialogTxt[1], aboutDialogTxt[2], aboutDialogTxt[3]);

const aboutDialog = document.getElementById('aboutDialog');

document.querySelector('#header').innerHTML = `
  <div id="headertext" class="stretch">Het Caribisch deel van het Koninkrijk der Nederlanden</div>
  <a id="gh-a" href="https://github.com/TWIAV/dutch-openlayers-examples/tree/main/caribisch-deel-koninkrijk-nederland" target="newTab" title="De broncode van deze applicatie staat op GitHub"><svg class="octicon octicon-mark-github v-align-middle" height="32" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg></a>
`

// default zoom and center
let zoom = 6;
let center = [-7787792, 1635285];

if (window.location.hash !== '') {
  // try to restore center and zoom-level from the URL
  const hash = window.location.hash.replace('#map=', '');
  const parts = hash.split('/');
  if (parts.length === 3) {
    zoom = parseFloat(parts[0]);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
  }
}

const attribution = new Attribution({
  collapsible: false,
});

// tooltip element
const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip';
tooltipElement.id = 'tooltip';


// Create an overlay to anchor the tooltip to the map.
const tooltipOverlay = new Overlay({
  element: tooltipElement,
  offset: [18, 0],
  positioning: 'center-left'
});

const caribischDeel = new VectorLayer({
  source: new VectorSource({
    url: 'caribisch-deel.geojson',
    format: new GeoJSON()
  }),
  style:new Style({
    stroke: new Stroke({color: 'rgba(255, 165, 0, 1)', width: 5})
  }),
  maxZoom: 11
});

const esriWorldImagery = new TileLayer({
  title: 'Esri World Imagery',
  type: 'base',
  source: new XYZ({
    url:
      'https://server.arcgisonline.com/ArcGIS/rest/services/' +
      'World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions:
      'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
      'rest/services/World_Imagery/MapServer">Esri</a>',
  }),
})

const bingMapsLuchtfoto = new TileLayer({
  title: 'Luchtfoto (Bing Maps)',
  type: 'base',
  source: new BingMaps({
	key: 'Your Bing Maps Key from https://www.bingmapsportal.com/ here',
    imagerySet: 'Aerial'
  }),
})

const openStreetMap = new TileLayer({
  title: 'OpenStreetMap',
  type: 'base',
  source: new OSM()
})

const baseMaps = new LayerGroup({
  title: 'Basiskaarten',
  fold: 'open',
  // layers: [bingMapsLuchtfoto, esriWorldImagery, openStreetMap]
  layers: [bingMapsLuchtfoto, openStreetMap]
});

const map = new Map({
  target: 'map',
  layers: [
    baseMaps,
	caribischDeel
  ],
  controls: defaultControls({rotate: false, attribution: false}).extend([attribution]),
  overlays: [tooltipOverlay],
  view: new View({center: center, zoom: zoom})
});

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  startActive: true,
  tipLabel: 'Lijst met lagen', // Optional label for button
  collapseTipLabel: 'Verberg lijst met lagen',
  groupSelectStyle: 'group' // Can be 'children' [default], 'group' or 'none' - groups have a checkbox but do not alter child visibility (like QGIS)
});

map.addControl(layerSwitcher);

// Toolbar
const toolBar = new Bar();
map.addControl(toolBar);
toolBar.setPosition('top-left');

toolBar.addControl(new ZoomToExtent({ extent: [-9616165, 535814, -5959418, 2734755]}));
toolBar.addControl(new FullScreen());

const rotate = new Rotate({
  tipLabel: 'Draai de kaart weer naar het noorden'
});

map.getView().on('change:rotation', function() {
  let rotation = map.getView().getRotation();
  if (rotation === 0) {
	map.removeControl(rotate);
  } else {
    toolBar.addControl(rotate);
  }
});

map.on ('moveend', manageControls);

function manageControls(evt) {
  const zoomOutBtn = document.querySelector(".ol-zoom-out");
  zoomOutBtn.title = 'Zoom uit';
  const zoomToExtentBtn = document.querySelector(".ol-zoom-extent");
  zoomToExtentBtn.firstChild.title = 'Zoom naar startpositie kaart';
  zoomToExtentBtn.firstChild.innerHTML = '&#8962';
  const fullScreenOpenBtn = document.querySelector(".ol-full-screen-false");
  if (fullScreenOpenBtn !== null) fullScreenOpenBtn.title = 'Volledig scherm openen';
  const fullScreenCloseBtn = document.querySelector(".ol-full-screen-true");
  if (fullScreenCloseBtn !== null) fullScreenCloseBtn.title = 'Volledig scherm sluiten';
}

const bookMarks = new GeoBookmark({
  title: 'Bladwijzers',
  marks: {
    'Benedenwindse Eilanden': {pos: [-7697667, 1379688], zoom: 10, permanent: true },
    'Aruba': {pos: [-7790036, 1403441], zoom: 12, permanent: true },
    'Curaçao': {pos: [-7677717, 1364305], zoom: 11, permanent: true },
    'Bonaire': {pos: [-7598595, 1361306], zoom: 11, permanent: true },
    'Bovenwindse Eilanden': {pos: [-7026397, 2010217], zoom: 10, permanent: true },
    'Sint Maarten': {pos: [-7020755, 2040892], zoom: 13, permanent: true },
    'Saba': {pos: [-7039393, 1994883], zoom: 14, permanent: true },
    'Sint Eustatius': {pos: [-7010665, 1978629], zoom: 13, permanent: true },
  },
  editable: false
});

map.addControl(bookMarks);

let shouldUpdate = true;
const view = map.getView();
const updatePermalink = function () {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }

  const center = view.getCenter();
  const hash =
    '#map=' +
    Math.round(view.getZoom()) +
    '/' +
    Math.round(center[0]) +
    '/' +
    Math.round(center[1])
  const state = {
    zoom: view.getZoom(),
    center: view.getCenter()
  };
  window.history.pushState(state, 'map', hash);
};

map.on('moveend', updatePermalink);

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

const highlightStyle = new Style({
  fill: new Fill({color: 'rgba(255, 165, 0, .4)'}),
  stroke: new Stroke({color: 'rgba(255, 165, 0, 1)', width: 2})
});

let selected = null;
map.on('pointermove', function (e) {
  if (selected !== null) {
    selected.setStyle(undefined);
    selected = null;
  }

  map.forEachFeatureAtPixel(e.pixel, function (f) {
    selected = f;
    f.setStyle(highlightStyle);
    return true;
  });

  if (selected) {
    tooltipElement.innerHTML = selected.get('description') + ':<br><b>' + selected.get('names') + '</b>';
	tooltipOverlay.setPosition(e.coordinate);
  } else {
	tooltipOverlay.setPosition(undefined);
   }
});

map.on('click', function (e) {
  if (selected !== null) {
    selected.setStyle(undefined);
    selected = null;
  }

  map.forEachFeatureAtPixel(e.pixel, function (f) {
    selected = f;
    return true;
  });

  if (selected) {
    map.getView().fit(selected.getGeometry(), map.getSize());
  }
});

// Define show about dialog control
class ShowAboutDialogControl extends Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '?';
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control';
	element.title = 'Over deze viewer';
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

// Toolbar About Dialog
const toolBarAboutDialog = new Bar();
map.addControl(toolBarAboutDialog);
toolBarAboutDialog.setPosition('bottom-left');

toolBarAboutDialog.addControl(new ShowAboutDialogControl());