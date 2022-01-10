import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import {Fill, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LayerGroup from 'ol/layer/Group';

const kadUrlWms = 'https://geodata.nationaalgeoregister.nl/kadastralekaart/wms/v4_0';

// Parcels
const kadParcelsSource = new TileWMS({
  url: kadUrlWms,
  params: {'LAYERS': 'Perceel', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
  attributions: '<a href="https://www.pdok.nl/introductie/-/article/basisregistratie-kadaster-brk-" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Percelen</a>'
});

const kadParcelsLayer = new TileLayer({
  title: 'Parcels',
  source: kadParcelsSource,
  maxResolution: 1.80
});

// Selected Parcel
const parcelStroke = new Stroke({
  color : 'rgba(41, 128, 185, 1)',
  width : 1    
});

const parcelFill = new Fill({
  color: 'rgba(41, 128, 185, 0.5)'
});

const parcelStyle = new Style({
  stroke : parcelStroke,
  fill : parcelFill
 });

// layer to show selected parcel
const parcelSelectionVectorSource = new VectorSource();

const parcelSelectionVectorLayer = new VectorLayer({
  // title: '', --> no title; the layer should not be visible in the layer switcher
  source: parcelSelectionVectorSource,
  declutter: true,
  style: parcelStyle
});

const kadLayers = new LayerGroup({
  title: 'Cadastral Information',
  fold: 'open',
  layers: [kadParcelsLayer, parcelSelectionVectorLayer]
});

const mapLayers = new LayerGroup({
	title: 'Layers',
	fold: 'open',
	layers: [kadLayers]
});

export { mapLayers };