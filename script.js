fetch('changes.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('changes-container');
    data.forEach(change => {
      const idDiv = document.createElement('div');
      idDiv.textContent = `ID: ${change.id}`;
      container.appendChild(idDiv);
    });
  });
