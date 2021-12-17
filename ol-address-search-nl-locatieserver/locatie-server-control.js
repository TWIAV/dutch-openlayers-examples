import style from './component-style.css';
import WKT from 'ol/format/WKT';
import * as olExtent from 'ol/extent';

// Information about the Locatieserver API: https://github.com/PDOK/locatieserver/wiki/API-Locatieserver
const LOCATIE_SERVER_URL = 'https://geodata.nationaalgeoregister.nl/locatieserver/v3';

class LocatieServerControl extends HTMLElement {
  constructor () {
    super();
    const _style = document.createElement('style');
    const _template = document.createElement('template');
    this.query = '';
    _style.innerHTML = `
      ${style}
      #locationServerControl{
        display: flex;
        position: absolute;
        top: 1em;
        right: .5em;
      }
      @media only screen and (max-width: 1024px) {
        #locationServerControl{
          bottom: 3em;
          left: 0.5em;
        }
      }
    `
    _template.innerHTML = `
      <div id="locationServerControl" class="parentControl">
        <input autoComplete="off" id="lsInput" class="control" type="text" placeholder="Search address (Netherlands only)" list="locatie-auto-complete">
        <datalist id="locatie-auto-complete"></datalist>
      </div>
    `

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(_style);
    this.shadow.appendChild(_template.content.cloneNode(true));

    this.shadow.getElementById('lsInput').addEventListener('input', (event) => {
      if (event.inputType === 'insertReplacementText' || event.inputType === undefined) {
        const options = this.shadow.getElementById('locatie-auto-complete').querySelectorAll('option');
        let id = '';
        for (let option of options) {
          if (option.value === event.target.value) {
            id = option.id;
          }
        }
        fetch(`${LOCATIE_SERVER_URL}/lookup?id=${id}&fl=id,weergavenaam,geometrie_rd`)
          .then((response) => {
            return response.json();
          })
          .then((data) => {
			let coord;
            const wktLoc = data.response.docs[0].geometrie_rd;
            const format = new WKT();
            const feature = format.readFeature(wktLoc);
			const geomType = feature.getGeometry().getType();
            const ext = feature.getGeometry().getExtent();
			if (geomType === 'Point') {
              coord = feature.getGeometry().getCoordinates();
			} else {
              coord = olExtent.getCenter(ext);
			}
			const address = data.response.docs[0].weergavenaam;
            this.dispatchEvent(new CustomEvent('location-selected', { bubbles: true, composed: true, detail: { extent: ext, coordinate: coord, result: address } }));
            this.shadow.getElementById('locatie-auto-complete').innerHTML = '';
            this.shadow.getElementById('lsInput').value = '';
            this.shadow.getElementById('lsInput').blur();
          })
      }
    })

    this.shadow.getElementById('lsInput').addEventListener('keyup', (e) => {
      if (this.query === e.target.value) {
        return
      }
      this.query = e.target.value;
      fetch(`${LOCATIE_SERVER_URL}/suggest?q=${this.query}`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.response.docs.length > 0) {
            let options = data.response.docs.map(x => `<option value="${x.weergavenaam}" id="${x.id}">`);
            let optionsHtml = options.join('');
            this.shadow.getElementById('locatie-auto-complete').innerHTML = optionsHtml;
          }
        })
    })
  }
  connectedCallback () {
    this.shadow.addEventListener('keydown', (event) => {
      event.stopPropagation();
    })
  }
}

export default LocatieServerControl