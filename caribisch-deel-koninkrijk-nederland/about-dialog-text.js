let aboutDialogHeaderTxt = 'Over deze Viewer';
let aboutDialogBodyTxt1 = '<h3>Geografisch</h3>';
aboutDialogBodyTxt1 += 'Het Caribisch deel van het Koninkrijk der Nederlanden bestaat uit zes eilanden in de Caraïbische Zee. Deze eilanden zijn onderdeel van de Antillen, de eilandengroep in het  Caraïbisch Gebied.<br><br>';
aboutDialogBodyTxt1 += 'Het gaat om twee clusters van ieder drie eilanden, namelijk:<br>';
aboutDialogBodyTxt1 += '<ol>';
aboutDialogBodyTxt1 += '<li>drie eilanden in het zuiden voor de kust van Venezuela: <b>Aruba</b>, <b>Curaçao</b> en <b>Bonaire</b></li>';
aboutDialogBodyTxt1 += '<li>drie eilanden in het noordoosten, op ongeveer 300 kilometer ten oosten van Puerto Rico: <b>Sint Maarten</b>, <b>Saba</b> en <b>Sint Eustatius</b></li>';
aboutDialogBodyTxt1 += '</ol>';
aboutDialogBodyTxt1 += 'De passaatwinden in het Caraïbisch gebied waaien over het algemeen vanuit het noordoosten. Daarom worden de zuidelijke eilanden, verwijzend naar deze heersende windrichting, ook wel aangeduid als de Benedenwindse Eilanden. De drie noordelijke eilanden worden gerekend tot de Bovenwindse Eilanden.<br><br>';
aboutDialogBodyTxt1 += 'Deze beide clusters, het Benedenwindse en het Bovenwindse deel van het Koninkrijk, liggen ongeveer 1000 kilometer uit elkaar.<br><br>';
aboutDialogBodyTxt1 += '<button id="start-button" class="start-button">Gebruik de Bladwijzers om snel op een eiland in te zoomen</button>';
let aboutDialogBodyTxt2 = '<h3>Bestuurlijk</h3>';
aboutDialogBodyTxt2 += 'Ook bestuurlijk zijn de eilanden onder te verdelen in twee groepen, namelijk in landen en in openbare lichamen:<br>';
aboutDialogBodyTxt2 += '<ol>';
aboutDialogBodyTxt2 += '<li><b>Sint Maarten</b> in het noorden en <b>Aruba</b> en <b>Curaçao</b> in het zuiden hebben de status van land. Zij vormen, samen met Nederland, de vier landen in het Koninkrijk.</li>';
aboutDialogBodyTxt2 += '<li><b>Bonaire</b> in het zuiden en <b>Saba</b> en <b>Sint Eustatius</b> in het noorden hebben de status van openbaar lichaam, en vallen onder Nederlands bestuur.</li>';
aboutDialogBodyTxt2 += '</ol>';
aboutDialogBodyTxt2 += 'Overigens behoort alleen de zuidkant van het eiland Sint Maarten tot het Koninkrijk. Het noordelijke deel van het eiland heet Collectivité de Saint-Martin en hoort bij Frankrijk.<br><br>';
aboutDialogBodyTxt2 += 'Voor meer informatie: zie deze pagina op <a href="https://www.rijksoverheid.nl/onderwerpen/caribische-deel-van-het-koninkrijk/vraag-en-antwoord/waaruit-bestaat-het-koninkrijk-der-nederlanden" target="blank">rijksoverheid.nl</a>.'

let aboutDialogFooterTxt = 'Deze kaartviewer is gebouwd met <a href="https://openlayers.org/" title="A high-performance, feature-packed library for all your mapping needs." target="blank">OpenLayers</a> - Heb je <a id="wm" href="#"></a>&nbsp;over deze applicatie? Stuur dan een&nbsp;<a id="wm2" href="#"></a>.';

const aboutDialogTxt = [aboutDialogHeaderTxt, aboutDialogBodyTxt1, aboutDialogBodyTxt2, aboutDialogFooterTxt];

export { aboutDialogTxt };