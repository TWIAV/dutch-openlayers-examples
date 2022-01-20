import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import WMTSSource from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import Projection from 'ol/proj/Projection';
import { getTopLeft } from 'ol/extent';

import convertToGrayScale from './convert-to-grayscale.js';

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

// Tiling schema for arcgis rest services from Esri NL differs from the Geonovum Tiling Schema
// Solution found in this thread at geoforum.nl:
// https://geoforum.nl/t/rd-tiling-schema-richtlijnen-geonovum-esri-wmts/2349

const resolutionsArcGIS = [3251.206502413005, 1625.6032512065026, 812.8016256032513, 406.40081280162565, 203.20040640081282, 101.60020320040641, 50.800101600203206, 25.400050800101603, 12.700025400050801, 6.350012700025401,  3.1750063500127004, 1.5875031750063502, 0.7937515875031751, 0.39687579375158755, 0.19843789687579377, 0.09921894843789689, 0.04960947421894844]
const matrixIdsArcGIS = [];
for (let i = 0; i < 17; ++i) {
  matrixIdsArcGIS[i] = i;
}

const dutchWMTSTileGridArcGIS = new WMTSTileGrid({
  origin: getTopLeft(proj28992Extent),
  resolutions: resolutionsArcGIS,
  matrixIds: matrixIdsArcGIS
});

// Inundations Limburg July 2021
const inundationMeuseLayer = new TileLayer({
  title: 'Maas (16-19 juli 2021)',
  source: new WMTSSource({
    url: 'https://tiles.arcgis.com/tiles/g6Leelps2PV3ZiQn/arcgis/rest/services/Beeldmateriaal_van_Maas_tijdens_hoogwater/MapServer/WMTS',
    layer: 'Beeldmateriaal_van_Maas_tijdens_hoogwater',
    matrixSet: 'default028mm', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGridArcGIS, style: 'default',
    attributions: '<a href="https://www.hetwaterschapshuis.nl/" target="_blank" title="Het Waterschapshuis"> | Het Waterschapshuis</a>'
  })
});

const inundationBrooksLayer = new TileLayer({
  title: 'Geul, Geleenbeek en Roer (16-17 juli 2021)',
  source: new WMTSSource({
    url: 'https://tiles.arcgis.com/tiles/g6Leelps2PV3ZiQn/arcgis/rest/services/Hoogwater/MapServer/WMTS',
    layer: 'Hoogwater',
    matrixSet: 'default028mm', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGridArcGIS, style: 'default',
    attributions: '<a href="https://www.hetwaterschapshuis.nl/" target="_blank" title="Het Waterschapshuis"> | Het Waterschapshuis</a>'
  })
});

const inundationLayerGroup = new LayerGroup({
  title: 'Overstromingen Juli 2021',
  fold: 'open',
  layers: [inundationBrooksLayer, inundationMeuseLayer]
});

// Comparison Layer (Swipe)
const luchtfoto2021OrthoHRRGBLayer = new TileLayer({
  title: 'Luchtfoto (voorjaar 2021 / 7,5 cm)',
  source: new WMTSSource({
    url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0',
    layer: '2021_orthoHR',
    matrixSet: 'EPSG:28992', projection: proj28992, crossOrigin: 'Anonymous', format: 'image/png', tileGrid: dutchWMTSTileGrid, style: 'default',
    attributions: 'PDOK: <a href="https://www.pdok.nl/introductie/-/article/luchtfoto-pdok" target="_blank" title="Publieke Dienstverlening Op de Kaart">Luchtfoto 2021 (7,5 cm)</a>'
  })
});

const swipeLayerGroup = new LayerGroup({
  title: 'Vergelijkingslaag (swipe)',
  fold: 'open',
  layers: [luchtfoto2021OrthoHRRGBLayer]
});

// Basemaps
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

const baseMapLayerGroup = new LayerGroup({
  title: 'Basiskaarten',
  fold: 'close',
  layers: [luchtfotoActueelOrthoHRRGBLayer, luchtfotoActueelOrtho25cmRGBLayer, brtAchtergrondkaartLayer, openTopoAchtergrondkaartGrijsLayer, openTopoAchtergrondkaartLayer, openTopoLayer]
});

export { baseMapLayerGroup, inundationLayerGroup, swipeLayerGroup };