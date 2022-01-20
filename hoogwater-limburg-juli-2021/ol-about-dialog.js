function createAboutDialog(headerTxt, bodyTxt1, bodyTxt2, footerTxt) {
  const modal = document.createElement('div');
  modal.className = 'ol-modal';
  modal.id = 'aboutDialog';

  const modalContent = document.createElement('div');
  modalContent.className = 'ol-modal-content';

  const modalHeader = document.createElement('div');
  modalHeader.className = 'ol-modal-header';
  modalHeader.innerHTML = '<h1>' + headerTxt + '</h1>';

  const modalClose = document.createElement('span');
  modalClose.className = 'ol-modal-close';
  modalClose.innerHTML = '&times';

  modalHeader.appendChild(modalClose);

  const modalBody = document.createElement('div');
  modalBody.className = 'ol-modal-body';

  const modalTable = document.createElement('table');
  modalTable.className = 'ol-modal-table';

  const modalTableRow = document.createElement('tr');
  modalTableRow.className = 'ol-modal-table-row';

  const modalTableData1 = document.createElement('td');
  modalTableData1.className = 'ol-modal-table-data';
  modalTableData1.innerHTML = '<p>' + bodyTxt1 + '</p>';

  const modalTableData2 = document.createElement('td');
  modalTableData2.className = 'ol-modal-table-data';
  modalTableData2.innerHTML = '<p>' + bodyTxt2 + '</p>';

  modalTableRow.append(modalTableData1, modalTableData2);
  modalTable.appendChild(modalTableRow);
  modalBody.appendChild(modalTable);

  const modalFooter = document.createElement('div');
  modalFooter.className = 'ol-modal-footer';
  modalFooter.innerHTML = '<p>' + footerTxt + '</p>';

  modalContent.append(modalHeader, modalBody, modalFooter);
  
  modal.appendChild(modalContent);

  const mapDiv = document.getElementById('map');
  mapDiv.appendChild(modal);

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("ol-modal-close")[0];
  
  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
  }

  // Get the button that closes the modal
  var startBtn = document.getElementById("start-button");
  
  // When the user clicks on <span> (x), close the modal
  startBtn.onclick = function() {
    modal.style.display = "none";
  }
}

export { createAboutDialog };