import './style.css';
import {Map, View} from 'ol';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import Projection from 'ol/proj/Projection';
import { getTopLeft } from 'ol/extent';
import Control from 'ol/control/Control';
import {Attribution, defaults as defaultControls} from 'ol/control';

// Awesome :-)
import '@fortawesome/fontawesome-free/js/all.js';

let reverseGeocoding = false;
let addressFound;

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
	element.title = 'Click map to get address';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleCopyUrl.bind(this), false);
  }

  handleCopyUrl() {
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

// Elements that make up the popup.
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');
const copyBtn = document.getElementById('copy-address-button');

copyBtn.addEventListener('click', copyAddressToClipboard);

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

const bgtAchtergrondkaartLayer = new TileLayer({
  title: 'BGT Achtergrondkaart',
  source: new WMTSSource({
    url: 'https://service.pdok.nl/lv/bgt/wmts/v1_0',
    layer: 'achtergrondvisualisatie',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/geo-services/-/article/basisregistratie-grootschalige-topografie-bgt-" target="_blank" title="Publieke Dienstverlening Op de Kaart">BGT Achtergrondkaart</a>'
  })
});

const minZoom = 12;
const maxZoom = 19;

const map = new Map({
  layers: [
    bgtAchtergrondkaartLayer
  ],
  controls: defaultControls({attribution: false}).extend([new revGeoControl(), attribution]),
  overlays: [addressPopup],
  target: 'map',
  view: new View({
    minZoom: minZoom,
    maxZoom: maxZoom,
    projection: proj28992,
    center: [136848, 455809],
    zoom: 12
  })
});

map.on ('moveend', handleZoomBtns);

function handleZoomBtns(evt) {
  const zoomLevel = Math.round(map.getView().getZoom());
  const zoomInBtn = document.querySelector(".ol-zoom-in");
  const zoomOutBtn = document.querySelector(".ol-zoom-out");
  // Gray out zoom buttons at maximum and minimum zoom respectively
  zoomLevel === maxZoom ? zoomInBtn.style.backgroundColor = "rgba(0,60,136,0.1)" : zoomInBtn.style.backgroundColor = "rgba(0,60,136,0.5)";
  zoomLevel === minZoom ? zoomOutBtn.style.backgroundColor = "rgba(0,60,136,0.1)" : zoomOutBtn.style.backgroundColor = "rgba(0,60,136,0.5)";
}

// Add a click handler to the map to render the popup.
map.on('singleclick', function (evt) {
  if (reverseGeocoding) { // Only retrieve address when revGeoButton is activated
    const coordinates = evt.coordinate;
    const rdX = Math.round(coordinates[0]);
    const rdY = Math.round(coordinates[1]);
    
    content.innerHTML = '<p><b>Coordinates (RD/EPSG:28992):</b><br>X = ' + rdX + ' / Y = ' + rdY + '</p>';

    fetch('https://geodata.nationaalgeoregister.nl/locatieserver/revgeo?X=' + rdX + '&Y=' + rdY + '&type=adres&distance=40').then(function(response) {
      return response.json();
    }).then(function(json) {
      if (json.response.numFound === 0) {
        content.innerHTML += '<p><b>Adress:</b><br>No address found at this location</p>';
      } else {
		addressFound = json.response.docs[0].weergavenaam;
        content.innerHTML += '<p><b>Address:</b><br>' + addressFound + '</p>';
      }
      addressPopup.setPosition(coordinates);
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
    alert("Address copied to clipboard:\n" + inputc.value);
  }
  inputc.parentNode.removeChild(inputc);
}

const instructionDiv = document.createElement('div');
instructionDiv.className = 'ol-instruction-label';
instructionDiv.id = 'instruction';
instructionDiv.innerHTML = '<h3>Instructions</h3><a href="#" id="instructions-closer" class="ol-popup-closer"></a>'
                         + '<p>Click the flag button <button style="background-color:rgba(0,60,136,0.5);border:white">'
                         + '<i class=\'fas fas fa-flag-checkered\' style="color:white"></i></button> above to activate the <b>reverse geocoding</b> functionality.</p>'
                         + '<p>Once activated <button style="background-color:white;border:white">'
                         + '<i class=\'fas fas fa-flag-checkered\' style="color:rgba(0,60,136,0.5)"></i></button> the cursor will change into a crosshair,'
						 + ' allowing you to click the map to get an address.</p>'
						 + '<p>Adresses are retrieved usint the <a href="https://geodata.nationaalgeoregister.nl/locatieserver/revgeo?X=155000&Y=463000&type=adres&distance=20" target="_blank">'
						 + 'Dutch \'Locatieserver\'</a>.</p>';

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