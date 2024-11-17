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

// Function to populate the tables with data
function populateTables(filteredData) {
  // Clear existing table data
  document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');

  // Populate tables based on the filtered data
  filteredData.forEach(item => {
    const tableId = item.class === 'Sensitive Source' ? 'sensitive-sources' :
                    item.class === 'Sensitive Sink' ? 'sensitive-sinks' : 'non-sensitive';

    const tableBody = document.querySelector(`#${tableId} tbody`);
    const row = document.createElement('tr');
    
    // Code
    const codeCell = document.createElement('td');
    codeCell.textContent = item.code;
    row.appendChild(codeCell);

    // Change Type
    const changeTypeCell = document.createElement('td');
    changeTypeCell.textContent = item.change_type;
    row.appendChild(changeTypeCell);

    // Data Returned
    const dataReturnedCell = document.createElement('td');
    dataReturnedCell.textContent = ""; //TODO
    row.appendChild(dataReturnedCell);

    // Data Accepted
    const dataAcceptedCell = document.createElement('td');
    dataAcceptedCell.textContent = ""; //TODO
    row.appendChild(dataAcceptedCell);

    // Categories
    const categoriesCell = document.createElement('td');
    categoriesCell.textContent = ""; //TODO
    row.appendChild(categoriesCell);

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
    const matchCategory = selectedCategory ? item.categories && item.categories.contains(selectedCategory) : true;

    return matchChangeType && matchClass && matchCategory;
  });

  // Populate the tables with the filtered data
  populateTables(filteredData);
}

// Function to export selected data to FlowDroid format
function exportFlowDroid() {
  const selectedRows = document.querySelectorAll('input[type="checkbox"]:checked');
  const flowDroidData = [];

  selectedRows.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const codeCell = row.querySelector('td:nth-child(1)');
    const classCell = row.closest('table').id;
    const dataReturnedCell = row.querySelector('td:nth-child(3)');
    const dataAcceptedCell = row.querySelector('td:nth-child(4)');
    
    flowDroidData.push({
      code: codeCell.textContent,
      class: classCell.replace('-', ' ').toUpperCase(),
      dataReturned: dataReturnedCell.textContent,
      dataAccepted: dataAcceptedCell.textContent
    });
  });

  // For demonstration, log to the console. You can replace this with actual export logic.
  console.log(flowDroidData);
  alert('Exported data to FlowDroid format. Check console for details.');
}

// Function to view source code
function viewSourceCode(link) {
  window.open(link, '_blank');
}

// Add event listeners to filters
document.getElementById('change-type').addEventListener('change', applyFilters);
document.getElementById('class').addEventListener('change', applyFilters);
document.getElementById('category').addEventListener('change', applyFilters);