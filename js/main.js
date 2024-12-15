/**
 * Fetches the data from 'changes.json' and stores it in the apiData array.
 * Populates tables with the fetched data.
 */
let apiData = [];

fetch('data/changes.json')
  .then((response) => response.json())
  .then((json) => {
    apiData = json;
    if (!apiData || apiData.length === 0) {
      console.log("No data available to populate tables");
    }             
   
    // Initially populate the tables with the full data
    populateTables(parseApiData(apiData));
  })
  .catch((error) => {
    console.error('Error fetching data:', error);

  });

function parseApiData(data) {
  const parsedData = [];

  data.forEach(pkg => {
    // Handle changed classes
    if (pkg.changed_classes) {
      pkg.changed_classes.forEach(cls => {
        if (cls.implemented_methods) {
          cls.implemented_methods.forEach(method => {
            parsedData.push({
              code: method.code,
              //code_long: method.code_long,
              link: method.link,
              class: method.class,  // Class name from changed_classes
              category: method.categories.toString() || null,
              change_type: method.change_type,
              data_returned: method.data_returned || [],
              data_transmitted: method.data_transmitted || []
            });
          });
        }
      });
    }

    // Handle added interfaces
    if (pkg.added_interfaces) {
      pkg.added_interfaces.forEach(iface => {
        if (iface.implemented_methods) {
          iface.implemented_methods.forEach(method => {
            parsedData.push({
              code: method.code,
             // code_long: method.code_long,
              link: method.link,
              class: method.class,  // Interface name from added_interfaces
              category: method.categories.toString()  || null,
              change_type: method.change_type,
              data_returned: method.data_returned || [],
              data_transmitted: method.data_transmitted || []
            });
          });
        }
      });
    }

    // Handle added interfaces
    if (pkg.changed_interfaces) {
      pkg.changed_interfaces.forEach(iface => {
        if (iface.implemented_methods) {
          iface.implemented_methods.forEach(method => {
            parsedData.push({
              code: method.code,
             // code_long: method.code_long,
              link: method.link,
              class: method.class,  // Interface name from added_interfaces
              category: method.categories.toString()  || null,
              change_type: method.change_type,
              data_returned: method.data_returned || [],
              data_transmitted: method.data_transmitted || []
            });
          });
        }
      });
    }
    // Handle added classes
    if (pkg.added_classes) {
      pkg.added_classes.forEach(cls => {
        if (cls.implemented_methods) {
          cls.implemented_methods.forEach(method => {
            parsedData.push({
              code: method.code,
              //code_long: method.code_long,
              link: method.link,
              class: method.class,  // Class name from added_classes
              category: method.categories.toString() || null,
              change_type: method.change_type,
              data_returned: method.data_returned || [],
              data_transmitted: method.data_transmitted || []
            });
          });
        }
      });
    }
  });

  return parsedData;
}

/**
 * Populates the tables with the filtered data.
 * The function will clear existing table rows and insert new ones based on the data passed.
 * 
 * @param {Array} filteredData - The data to populate the tables with.
 */
function populateTables(filteredData) {
  
  // Clear existing rows in all tables
  document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');
  console.log('rows cleared')
           // Store table bodies in a map for faster access

  const tableBodies = {
    'sensitive-sources': document.querySelector('#sensitive-sources tbody'),
    'sensitive-sinks': document.querySelector('#sensitive-sinks tbody'),
    'non-sensitive': document.querySelector('#non-sensitive tbody')
  };
  
  console.log(JSON.stringify(tableBodies, null, 2));

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
          // Make sure to log the tableId before calling toString
          console.log(tableId.toString());  
          
                   // Get the corresponding table body based on tableId
          const tableBody = tableBodies[tableId];
          
          // Ensure the table body exists before appending the row
          if (tableBody) {
            const row = createTableRow(item);
            tableBody.appendChild(row);

          const sensitiveSourcesBody = document.querySelector('#sensitive-sources tbody');
          console.log(sensitiveSourcesBody.innerHTML);  // Should log the <tbody> element or null 
          } else {
            console.warn(`Table with ID ${tableId} does not exist.`);
          }                
  });
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

  if (item.class === "Sensitive Source") {
    const dataReturnedCell = document.createElement('td');
    dataReturnedCell.innerHTML = getSensitiveSourceDataReturned(item);
    row.appendChild(dataReturnedCell);
  }

  if (item.class === "Sensitive Sink") {
    const dataTransmittedCell = document.createElement('td');
    dataTransmittedCell.innerHTML = getSensitiveSinkDataTransmitted(item);
    row.appendChild(dataTransmittedCell);
  }
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
    const matchCategory = selectedCategory ? item.category == selectedCategory : true;

    return matchChangeType && matchClass && matchCategory;
  });

  populateTables(filteredData);
}

/**
 * Returns the formatted data for the 'Data Returned' column in a 'Sensitive Source' row.
 * 
 * @param {Object} item - The data item of the sensitive source.
 * @returns {string} - The formatted data returned description.
 */
function getSensitiveSourceDataReturned(item) {
  if (item.data_returned && item.data_returned.length > 0) {
    return item.data_returned
      .filter(data => data.possibly_sensitive)
      .map(data => data.description)
      .join("<br>");
  }
  return "None";
}

/**
 * Returns the formatted data for the 'Data Transmitted' column in a 'Sensitive Sink' row.
 * 
 * @param {Object} item - The data item of the sensitive sink.
 * @returns {string} - The formatted data transmitted description.
 */
function getSensitiveSinkDataTransmitted(item) {
  if (item.data_transmitted && item.data_transmitted.length > 0) {
    return item.data_transmitted.map(data =>
      data.destinations
        .filter(dest => dest.accesible_to_third_parties && data.possibly_sensitive)
        .map(dest => `${data.type} to ${dest.resource}`)
        .join("<br>")
    ).join("<br>");
  }
  return "None";
}

/**
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

  const jsonData = JSON.stringify(apiData, null, 2);  // Pretty-printing the JSON
  const blob = new Blob([jsonData], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'changes.json';
  link.click();
}

/**
 * Opens the source code in a new tab.
 * 
 * @param {string} link - The URL of the source code to view.
 */
function viewSourceCode(link) {
  window.open(link, '_blank');
}

// Event Listeners for filter changes
document.getElementById('change-type').addEventListener('change', applyFilters);
document.getElementById('class').addEventListener('change', applyFilters);
document.getElementById('category').addEventListener('change', applyFilters);
