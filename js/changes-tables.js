/**
 * The array containing the fetched data from 'changes.json'.
 */
let apiData = [];

// Fetch the data from 'changes.json' and store it in apiData and populate the tables with the fetched data.
fetch('data/json/changes.json')
  .then((response) => response.json())
  .then((json) => {
    apiData = json;
    apiData = parseApiData(apiData);
    populateTables(apiData);
  })

/**
 * Parses the given data to extract all implemented accesible methods and compiles them into a flat array format.
 * 
 * @param {Array} data - The package objects to be parsed.
 * @returns {Array} - The objects containting the implemented methods details.
 */
function parseApiData(data) {
  const parsedData = [];
  const keysToProcess = ["changed_classes", "added_interfaces", "changed_interfaces", "added_classes"];
  keysToProcess.forEach(key => {
    data.forEach(pkg => {
      pkg[key]?.forEach(item => {
        pushData(parsedData, pkg.package+"."+item.name, item.implementedMethods);
      });
    });
  });
  return parsedData;
}

/**
 * Pushes the implemented_method's data to the given parsedData field.
 * 
 * @param {Array} parsedData - The array to push the data to.
 * @param {String} packageName - The package name to push.
 * @param {Array} implementedMethods - The implementedMethods to push.
 */
function pushData(parsedData, packageName, implementedMethods) {
  if (implementedMethods) {
    implementedMethods.forEach(method =>
      parsedData.push({
        package: packageName, // Explicitly set the package name
        code: method.code,
        codeLong: method.codeLong,
        link: method.link,
        class: method.class,
        category: method.category || null,
        changeType: method.changeType,
        dataReturned: method.dataReturned || [],
        dataTransmitted: method.dataTransmitted || []
      })
    );
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
    'non-sensitives': document.querySelector('#non-sensitives tbody')
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
        tableId = 'non-sensitives';
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
  changeTypeCell.textContent = item.changeType;
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
    const matchChangeType = changeType ? item.changype === changeType : true;
    const matchClass = selectedClass ? item.class === selectedClass : true;
    const matchCategory = selectedCategory ? item.category === selectedCategory : true;
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
  if (item.dataReturned && item.dataReturned.length > 0) {
    return item.dataReturned.map(data => data.description).join("<br>");
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
  if (item.dataTransmitted && item.dataTransmitted.length > 0) {
    return item.dataTransmitted.map(data => data.description).join("<br>");
  }
  return "None";
}
