// Sample Data (use your actual data here)
const data = [
  {
    "id": "1",
    "import": "android.accessibilityservice.AccessibilityService",
    "code": "android.accessibilityservice.BrailleDisplayController getBrailleDisplayController()",
    "link": "https://developer.android.com/reference/android/accessibilityservice/AccessibilityService#getBrailleDisplayController()",
    "class": "Non-Sensitive",
    "categories": null,
    "change_type": "Addition",
    "data_returned": [
      {
        "type": "android.accessibilityservice.BrailleDisplayController",
        "possibly_sensitive": false
      }
    ],
    "data_accepted": null
  },
  {
    "id": "2",
    "import": "android.adservices.adid.AdIdManager",
    "code": "void getAdId(java.util.concurrent.Executor, android.adservices.common.AdServicesOutcomeReceiver<android.adservices.adid.AdId, java.lang.Exception>)",
    "link": "https://developer.android.com/reference/android/adservices/adid/AdIdManager#getAdId(java.util.concurrent.Executor,%20android.adservices.common.AdServicesOutcomeReceiver%3Candroid.adservices.adid.AdId,java.lang.Exception%3E)",
    "class": "Sensitive Source",
    "categories": [
      {
        "name": "Device or other IDs",
      }
    ],
    "change_type": "Addition",
    "data_returned": [
       {
        "type": "android.adservices.adid.AdId",
        "categories": [
          {
            "name": "Device or other IDs",
          }
        ],
        "possibly_sensitive": true
      }
    ],
    "data_accepted": [
      {
        "type": "java.util.concurrent.Executor",
        "possibly_sensitive": false
      },
      {
        "type": "android.adservices.common.AdServicesOutcomeReceiver<android.adservices.adid.AdId, java.lang.Exception>",
        "possibly_sensitive": false
      }
    ]
  }
]

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
    dataReturnedCell.textContent = item.data_returned.map(data => data.type).join(', ');
    row.appendChild(dataReturnedCell);

    // Data Accepted
    const dataAcceptedCell = document.createElement('td');
    dataAcceptedCell.textContent = item.data_accepted ? item.data_accepted.map(data => data.type).join(', ') : 'N/A';
    row.appendChild(dataAcceptedCell);

    // Categories
    const categoriesCell = document.createElement('td');
    categoriesCell.textContent = item.categories ? item.categories.map(cat => cat.name).join(', ') : 'N/A';
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
  const filteredData = data.filter(item => {
    const matchChangeType = changeType ? item.change_type === changeType : true;
    const matchClass = selectedClass ? item.class === selectedClass : true;
    const matchCategory = selectedCategory ? item.categories && item.categories.some(cat => cat.name === selectedCategory) : true;

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

// Initially populate the tables
populateTables(data);

// Add event listeners to filters
document.getElementById('change-type').addEventListener('change', applyFilters);
document.getElementById('class').addEventListener('change', applyFilters);
document.getElementById('category').addEventListener('change', applyFilters);
