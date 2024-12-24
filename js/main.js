/**
 * The array containing the fetched data from 'changes.json'.
 */
let apiData = [];

// Fetch the data from 'changes.json' and store it in apiData and populate the tables with the fetched data.
fetch('data/changes.json')
  .then((response) => response.json())
  .then((json) => {
    apiData = json;
    apiData = parseApiData(apiData);
    populateTables(apiData);
  })

/**
 * Parses the given data to extract all implemented methods and compiles them into a flat array format.
 * 
 * @param {Array} data - The package objects to be parsed.
 * @returns {Array} - The objects containting the implemented methods details.
 */

function parseApiData(data) {
  const parsedData = [];
  const keysToProcess = ["changed_classes", "added_interfaces", "changed_interfaces", "added_classes"];
  keysToProcess.forEach(key => {
    data.forEach(pkg => {
      pkg[key]?.forEach(item => pushData(parsedData, item.implemented_methods));
    })
  })
  return parsedData
}


/**
 * Pushes the implemented_method's data to the given parsedData field.
 * 
 * @param {Array} parsedData - The array to push the data to.
 * @param {Array} implemented_methods - The implemented_methods to push.
 */
function pushData(parsedData, implemented_methods) {
  if (implemented_methods) {
    implemented_methods.forEach(method =>
      parsedData.push({
        code: method.code,
        code_long: method.code_long,
        link: method.link,
        class: method.class,
        category: method.category || null,
        change_type: method.change_type,
        data_returned: method.data_returned || [],
        data_transmitted: method.data_transmitted || []
      })
    )
  }
}

/**
 * Populates the tables with the filtered data.
 * The function will clear existing table rows and insert new ones based on the data passed.
 * 
 * @param {Array} filteredData - The data to populate the tables with.
 */
function populateTables(filteredData) {
  const tableBodies = {
    'sensitive-sources': document.querySelector('#sensitive-sources tbody'),
    'sensitive-sinks': document.querySelector('#sensitive-sinks tbody'),
    'non-sensitive': document.querySelector('#non-sensitive tbody')
  }

  // Clear existing table rows
  Object.values(tableBodies).forEach(tableBody => {
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  })

  filteredData.forEach(item => {

    let tableId;
    switch (item.class) {
      case "Sensitive Source":
        tableId = 'sensitive-sources';
        break;
      case "Sensitive Sink":
        tableId = 'sensitive-sinks';
        break;
      case "Non-Sensitive":
      default:
        tableId = 'non-sensitive';
        break;
    }
    const tableBody = tableBodies[tableId];
    tableBody.appendChild(createTableRow(item));
  })
}

/**
 * Creates a table row for a given item of data.
 * 
 * @param {Object} item - The data item to create a row for.
 * @returns {HTMLTableRowElement} - The created table row element.
 */
function createTableRow(item) {
  const row = document.createElement('tr');

  const codeCell = document.createElement('td');
  const linkElement = document.createElement('a');
  linkElement.href = item.link;
  linkElement.textContent = item.code;
  codeCell.appendChild(linkElement);
  row.appendChild(codeCell);

  const changeTypeCell = document.createElement('td');
  changeTypeCell.textContent = item.change_type;
  row.appendChild(changeTypeCell);

  const categoriesCell = document.createElement('td');
  categoriesCell.textContent = item.category ? item.category : "";
  row.appendChild(categoriesCell);

  const dataReturnedCell = document.createElement('td');
  dataReturnedCell.innerHTML = getDataReturnedDescription(item);
  row.appendChild(dataReturnedCell);

  const dataTransmittedCell = document.createElement('td');
  dataTransmittedCell.innerHTML = getDataTransmittedDescription(item);
  row.appendChild(dataTransmittedCell);

  return row;
}

/**
 * Filters the data based on user-selected filters and repopulates the tables with the filtered data.
 */
function applyFilters() {
  const changeType = document.getElementById('change-type').value;
  const selectedClass = document.getElementById('class').value;
  const selectedCategory = document.getElementById('category').value;
  const filteredData = apiData.filter(item => {
    const matchChangeType = changeType ? item.change_type === changeType : true;
    const matchClass = selectedClass ? item.class === selectedClass : true;
    const matchCategory = selectedCategory ? item.category === selectedCategory : true;
    console.log(selectedCategory)
    return matchChangeType && matchClass && matchCategory;
  });

  populateTables(filteredData);
}

/**
 * Returns the formatted data for the 'Data Returned' column in a 'Sensitive Source' row.
 * 
 * @param {Object} item - The data item of the sensitive source.
 * @returns {string} - The formatted data returned description with line breaks.
 */
function getDataReturnedDescription(item) {
  if (item.data_returned && item.data_returned.length > 0) {
    return item.data_returned.map(data => data.description).join("<br>");
  }
  return "None";
}

/**
 * Returns the formatted data for the 'Data Transmitted' column in a 'Sensitive Sink' row.
 * 
 * @param {Object} item - The data item of the sensitive sink.
 * @returns {string} - The formatted data transmitted description with line breaks.
 */
function getDataTransmittedDescription(item) {
  if (item.data_transmitted && item.data_transmitted.length > 0) {
    return item.data_transmitted.map(data => data.description).join("<br>");
  }
  return "None";
}

/**
 * Exports the data to FlowDroid format 
 * @todo Write the documentation.
 * @todo Implement this function.
 */
function exportFlowDroid() {

}

/**
 * Triggers the download of the current `apiData` as a JSON file named 'changes.json'.
 */
function downloadJSON() {
  if (!apiData || apiData.length === 0) {
    alert('No data available to download');
    return;
  }
  // Pretty-printing the JSON  
  const jsonData = JSON.stringify(apiData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'changes.json';
  link.click();
}

// Event Listeners for filter changes
document.getElementById('change-type').addEventListener('change', applyFilters);
document.getElementById('class').addEventListener('change', applyFilters);
document.getElementById('category').addEventListener('change', applyFilters);
