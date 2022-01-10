import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import WFS from 'ol/format/WFS';
import GeoJSON from 'ol/format/GeoJSON';
import {Circle as CircleStyle, Fill, Stroke, Style, Text} from 'ol/style';
// import {
  // and as andFilter,
  // equalTo as equalToFilter,
  // like as likeFilter,
// } from 'ol/format/filter';

const auUrlWfs = 'https://service.pdok.nl/kadaster/bestuurlijkegebieden/wfs/v1_0';

// Municipalities
const auMunicipalitiesSource = new VectorSource({
  attributions: '<a href="https://www.pdok.nl/geo-services/-/article/bestuurlijke-gebieden" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Gemeenten</a>'
});

const auMunicipalitiesStyle = new Style({
  fill: new Fill({color: 'rgba(41, 128, 185, 0)'}),
  stroke: new Stroke({color: 'rgba(41, 128, 185, 1)', width: 1})
});

const auMunicipalitiesLayer = new VectorLayer({
  title: 'Municipalities',
  source: auMunicipalitiesSource,
  style: auMunicipalitiesStyle 
});

const auMunicipalitiesFeatureRequest = new WFS({ version: '2.0.0' }).writeGetFeature({
  srsName: 'EPSG:28992',
  featureTypes: ['bestuurlijkegebieden:Gemeentegebied'],
  outputFormat: 'application/json'
});

// Provinces
const auProvincesSource = new VectorSource({
  attributions: '<a href="https://www.pdok.nl/geo-services/-/article/bestuurlijke-gebieden" target="_blank" title="Publieke Dienstverlening Op de Kaart"> | Provincies</a>'
});

const auProvincesStyle = new Style({
  fill: new Fill({color: 'rgba(169, 50, 38, 0)'}),
  stroke: new Stroke({color: 'rgba(169, 50, 38, 1)', width: 1.5})
});

const auProvincesLayer = new VectorLayer({
  title: 'Provinces',
  source: auProvincesSource,
  style: auProvincesStyle 
});

const auProvincesFeatureRequest = new WFS({ version: '2.0.0' }).writeGetFeature({
  srsName: 'EPSG:28992',
  featureTypes: ['bestuurlijkegebieden:Provinciegebied'],
  outputFormat: 'application/json'
});

let wfsLayers = [{
  "url" : auUrlWfs, 
  "request" : auProvincesFeatureRequest,
  "source" : auProvincesSource,
  "stopLoader" : false
},
{
  "url" : auUrlWfs, 
  "request" : auMunicipalitiesFeatureRequest,
  "source" : auMunicipalitiesSource,
  "stopLoader" : true 
}];


for(let i = 0; i < wfsLayers.length; i++) {
  var wfsLayer = wfsLayers[i];

  fetchWfsFeatures(wfsLayer.url, wfsLayer.request, wfsLayer.source, wfsLayer.stopLoader);

}

function fetchWfsFeatures(url, request, source, stopLoader) {
  const t0 = performance.now();
  fetch(url, {
    method: 'POST',
    body: new XMLSerializer().serializeToString(request),
  }).then(function (response) {
    document.getElementById("loader").style.display = "block";
    return response.json();
    }).then(function (json) {
      const features = new GeoJSON().readFeatures(json);
	  features.forEach(function (feature) {
		source.addFeature(feature);
	  })
    }).then(function() {
	  // console.log(source.getFeatures().length);
	  if (stopLoader) {
        document.getElementById("loader").style.display = "none";
        const t1 = performance.now();
	    console.log("Fetching and loading WFS data took " + (t1 - t0) + " milliseconds.");
	  }
    });
}

const adminUnitsLayers = new LayerGroup({
	title: 'Administrative Units',
	fold: 'open',
	layers: [auMunicipalitiesLayer, auProvincesLayer]
});

const mapLayers = new LayerGroup({
	title: 'Layers',
	fold: 'open',
	layers: [adminUnitsLayers]
});

export { mapLayers };