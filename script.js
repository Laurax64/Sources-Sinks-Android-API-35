let apiData = [];

// Fetch the JSON file and populate the apiData variable
fetch('changes.json') 
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
     apiData = data.filter(item => item.id !== -1); // Assign the fetched data to the apiData variable
    populateTables(apiData); // Populate the tables with the loaded data
  })
  .catch(error => console.error('Error loading JSON:', error));

  
  // Populate Tables
  function populateTables(data) {
    ['sensitive-sources', 'sensitive-sinks', 'non-sensitive'].forEach(tableId => {
      document.getElementById(tableId).querySelector('tbody').innerHTML = ''; // Clear previous data
    });
  
    data.forEach(item => {
      const tableId = item.class === "Sensitive Source" ? 'sensitive-sources' :
        item.class === "Sensitive Sink" ? 'sensitive-sinks' : 'non-sensitive';
  
      const row = `
        <tr>
          <td>${item.id}</td>
          <td><a href="${item.link}" target="_blank">${item.java_code}</a></td>
          <td>${item.change_type}</td>
          <td>${item.category || "Uncategorized"}</td>
          <td>${item.description || "No description available"}</td>
          <td><button onclick="viewCode(${item.id})">View Code</button></td>
          <td><input type="checkbox" data-id="${item.id}"></td>
        </tr>`;
      document.getElementById(tableId).querySelector('tbody').innerHTML += row;
    });
  }
  
  // View Code
  function viewCode(id) {
    const entry = apiData.find(item => item.id === id);
    alert(`Java Code:\n${entry.java_code}\n\nKotlin Code:\n${entry.kotlin_code}`);
  }
  
  // Filter Functionality
  function applyFilters() {
    const changeType = document.getElementById('change-type').value;
    const apiClass = document.getElementById('class').value;
    const category = document.getElementById('category').value;
  
    const filteredData = apiData.filter(item => {
      return (!changeType || item.change_type === changeType) &&
        (!apiClass || item.class === apiClass) &&
        (!category || item.category === category);
    });
  
    populateTables(filteredData);
  }
  
  // Export Selected APIs to FlowDroid Format
function exportFlowDroid() {
  // Get selected IDs from checkboxes
  const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.getAttribute('data-id')));

  // Filter selected APIs and map to FlowDroid format
  const flowDroidEntries = apiData
    .filter(item => selectedIds.includes(item.id)) // Only include selected items
    .map(item => {
      if (item.class === "Sensitive Source") {
        return `<${item.import}: ${getReturnType(item.java_code)} ${getMethodSignature(item.java_code)}> -> _SOURCE_`;
      } else if (item.class === "Sensitive Sink") {
        return `<${item.import}: ${getReturnType(item.java_code)} ${getMethodSignature(item.java_code)}> -> _SINK_`;
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

// Helper function to extract return type from the Java method signature
function getReturnType(javaCode) {
  const methodParts = javaCode.split(' ');
  return methodParts[0]; // Return type is the first word
}

// Helper function to extract method signature from the Java method signature
function getMethodSignature(javaCode) {
  const methodStart = javaCode.indexOf(' ') + 1; // Start after the return type
  return javaCode.substring(methodStart).trim();
}

// Initialize
populateTables(apiData);
  
