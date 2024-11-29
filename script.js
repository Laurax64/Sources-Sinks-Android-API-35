// Fetch data and populate tables
let apiData = [];

fetch('changes.json')
  .then((response) => response.json())
  .then((json) => {
    apiData = json;
    // Initially populate the tables with the full data
    populateTables(apiData);
  })
  .catch((error) => console.error('Error fetching data:', error));

function populateTables(filteredData) {
  // Clear existing table data
  document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');

  filteredData.forEach(item => {
    const tableId = item.class === 'Sensitive Source' ? 'sensitive-sources' :
      item.class === 'Sensitive Sink' ? 'sensitive-sinks' : 'non-sensitive';

    const tableBody = document.querySelector(`#${tableId} tbody`);
    const row = document.createElement('tr');

    // Code 
    const codeCell = document.createElement('td');
    const linkElement = document.createElement('a');
    linkElement.href = item.link;
    linkElement.textContent = item.code;
    codeCell.appendChild(linkElement);
    row.appendChild(codeCell);

    // Change Type
    const changeTypeCell = document.createElement('td');
    changeTypeCell.textContent = item.change_type;
    row.appendChild(changeTypeCell);

    // Categories
    const categoriesCell = document.createElement('td');
    categoriesCell.textContent = item.category ? item.category : "";
    row.appendChild(categoriesCell);

    // Data Returned (Sensitive Sources only)
    if (item.class === "Sensitive Source") {
      const dataReturnedCell = document.createElement('td');
      if (item.data_returned && item.data_returned.length > 0) {
        dataReturnedCell.innerHTML = item.data_returned
          .filter(data => data.possibly_sensitive)
          .map(data => data.description)
          .join("<br>");
      } else {
        dataReturnedCell.textContent = "None";
      }
      row.appendChild(dataReturnedCell);
    }

    // Data Transmitted (Sensitive Sinks only)
    if (item.class === "Sensitive Sink") {
      const dataTransmittedCell = document.createElement('td');
      if (item.data_transmitted && item.data_transmitted.length > 0) {
        dataTransmittedCell.innerHTML = item.data_transmitted.map(data =>
          data.destinations
            .filter(dest => dest.accesible_to_third_parties && data.possibly_sensitive)
            .map(dest => `${data.type} to ${dest.resource}`) //TODO Consider changing type to description.
            .join("<br>")
        ).join("<br>");
      } else {
        dataTransmittedCell.textContent = "None";
      }
      row.appendChild(dataTransmittedCell);
    }

    // Select Checkbox
    const selectCell = document.createElement('td');
    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCell.appendChild(selectCheckbox);
    row.appendChild(selectCell);

    tableBody.appendChild(row);
  });
}

// Function to apply filters
function applyFilters() {
  const changeType = document.getElementById('change-type').value;
  const selectedClass = document.getElementById('class').value;
  const selectedCategory = document.getElementById('category').value;

  // Filter the data based on selected options
  const filteredData = apiData.filter(item => {
    const matchChangeType = changeType ? item.change_type === changeType : true;
    const matchClass = selectedClass ? item.class === selectedClass : true;
    const matchCategory = selectedCategory ? item.category == selectedCategory : true;

    return matchChangeType && matchClass && matchCategory;
  });

  // Populate the tables with the filtered data
  populateTables(filteredData);
}

// Function to export selected data to FlowDroid format
function exportFlowDroid() {

}

function downloadJSON() {

}

// Function to view source code
function viewSourceCode(link) {
  window.open(link, '_blank');
}

// Add event listeners to filters
document.getElementById('change-type').addEventListener('change', applyFilters);
document.getElementById('class').addEventListener('change', applyFilters);
document.getElementById('category').addEventListener('change', applyFilters);