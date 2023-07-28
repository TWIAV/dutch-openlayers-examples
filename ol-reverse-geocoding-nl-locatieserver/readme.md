# OpenLayers example: reverse geocoding with the Dutch 'Locatieserver'

Reverse geocoding (i.e. retrieving addresses) with the Dutch 'Locatieserver', example: https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?X=155000&Y=463000&type=adres&distance=20

This demo web mapping application shows how to use this reverse geocoding functionality in an [OpenLayers](https://openlayers.org/) application. In this [demo app](https://twiav.nl/nl/openlayers/ol-reverse-geocoding-nl-locatieserver): just click the map to retrieve an address.

Requires [`npm`](https://www.npmjs.com/).

To install the dependencies and run in debug mode:

```bash
npm install # install dependencies
npm start
```