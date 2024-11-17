fetch('changes.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('changes-container');
    data.forEach(change => {
      const idDiv = document.createElement('div');
      idDiv.textContent = `ID: ${change.data_returned.map(data => data.type).join(', ')}`;
      container.appendChild(idDiv);
    });
  });
