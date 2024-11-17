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
    const row = `
      <tr>
      <td><a href="${item.link}" target="_blank">${item.code}</a></td>
      <td>${item.change_type}</td>
      <td>${item.item.categories || "Uncategorized"}</td>
      <td><input type="checkbox" data-id="${item.id}"></td>
    </tr>`;
    
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
  // Get selected IDs from checkboxes
  const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.getAttribute('data-id')));
  // Filter selected APIs and map to FlowDroid format
  const flowDroidEntries = apiData
    .filter(item => selectedIds.includes(item.id)) // Only include selected items
    .map(item => {
      if (item.class === "Sensitive Source") {
        return `<${item.import}: ${getReturnType(item.code)} ${getMethodSignature(item.code)}> -> _SOURCE_`;
      } else if (item.class === "Sensitive Sink") {
        return `<${item.import}: ${getReturnType(item.code)} ${getMethodSignature(item.code)}> -> _SINK_`;
      }
      return null; // Exclude Non-Sensitive or unclassified entries
    })
    .filter(entry => entry !== null); // Remove null entries
  // Join all entries into a single string with newlines
  const flowDroidOutput = flowDroidEntries.join('\n');
  // Create a downloadable .txt file
  const blob = new Blob([flowDroidOutput], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flowdroid.txt';
  a.click();
}

// Function to view source code
function viewSourceCode(link) {
  window.open(link, '_blank');
}

// Add event listeners to filters
document.getElementById('change-type').addEventListener('change', applyFilters);
document.getElementById('class').addEventListener('change', applyFilters);
document.getElementById('category').addEventListener('change', applyFilters);