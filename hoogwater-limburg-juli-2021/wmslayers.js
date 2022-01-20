import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
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
  title: 'Percelen',
  visible: false,
  source: kadParcelsSource,
  maxResolution: 1.80
});

// Selected Feature Style
const selectedFeatureFill = new Fill({
  color: 'rgba(255, 255, 255, 0.4)'
});

const selectedFeatureStroke = new Stroke({
  color : '#3399CC',
  width : 1.25    
});

const selectedFeatureStyle = new Style({
  image: new CircleStyle({
    fill: selectedFeatureFill,
    stroke: selectedFeatureStroke,
    radius: 5,
  }),
  fill : selectedFeatureFill,
  stroke : selectedFeatureStroke
 });

// layer to show selected parcel
const parcelSelectionVectorSource = new VectorSource();

const parcelSelectionVectorLayer = new VectorLayer({
  // title: '', --> no title; the layer should not be visible in the layer switcher
  source: parcelSelectionVectorSource,
  declutter: true,
  style: selectedFeatureStyle
});

const dkkLayerGroup = new LayerGroup({
  title: 'Digitale Kadastrale Kaart',
  fold: 'open',
  layers: [kadParcelsLayer, parcelSelectionVectorLayer]
});

export { dkkLayerGroup };