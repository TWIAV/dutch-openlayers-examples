# OpenLayers example: address search with the Dutch 'Locatieserver'

Address search with the Dutch 'Locatieserver', example: https://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup?id=adr-cd8ae950d6870241e8f3a2208e6fd086&fl=id,weergavenaam,geometrie_rd

This demo web mapping application shows how to use the lookup and suggest functionality of the 'Locatieserver' in an [OpenLayers](https://openlayers.org/) application.

The example shown here is strongly based on this [PDOK Locatie Server demo application](https://github.com/arbakker/pdok-js-map-examples/tree/master/openlayers-locatie-server).  

After tweaking the css, the html and even the js code of the above mentioned example to suit my needs, I came up with the solution for an address search bar which can be seen in this [demo app](https://twiav.nl/nl/openlayers/ol-address-search-nl-locatieserver).

Want to play around with the code?

Requires [`npm`](https://www.npmjs.com/).

To install the dependencies and run in debug mode:

```bash
npm install # install dependencies
npm start
```