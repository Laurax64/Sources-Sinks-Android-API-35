function assignIds(data) {
  return data.map((item, index) => {
    if (!item.id) {
      item.id = index + 1; // Assign a unique ID
    }
    return item;
  });
}

function groupByPackage(data) {
  return data.reduce((groups, item) => {
    if (!groups[item.import]) {
      groups[item.import] = [];
    }
    groups[item.import].push(item);
    return groups;
  }, {});
}

function populatePackages(data) {
  const container = document.getElementById("api-changes");
  container.innerHTML = ""; // Clear existing content

  const packages = groupByPackage(data);

  for (const [packageName, apis] of Object.entries(packages)) {
    const packageDiv = document.createElement("div");
    packageDiv.className = "package-group";

    const title = document.createElement("div");
    title.className = "package-title";
    title.textContent = packageName;
    title.onclick = () => toggleTable(packageName);

    packageDiv.appendChild(title);

    const table = document.createElement("table");
    table.className = "api-table";
    table.id = `table-${packageName}`;

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Select</th>
        <th>Code</th>
        <th>Change Type</th>
        <th>Class</th>
        <th>Data Returned</th>
        <th>Data Accepted</th>
        <th>Categories</th>
        <th>Description</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    apis.forEach(api => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td><input type="checkbox" data-id="${api.id}"></td>
        <td>${api.code || "N/A"}</td>
        <td>${api.change_type || "N/A"}</td>
        <td>${api.class || "N/A"}</td>
        <td>${formatData(api.data_returned)}</td>
        <td>${formatData(api.data_accepted)}</td>
        <td>${formatCategories(api.categories)}</td>
        <td>${api.link ? `<a href="${api.link}" target="_blank">Link</a>` : "N/A"}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    packageDiv.appendChild(table);
    container.appendChild(packageDiv);
  }
}

function formatData(data) {
  if (!data || !data.data) return "N/A";
  const sensitivity = data.data.possibly_sensitive ? " (Sensitive)" : "";
  return `${data.data.type || "N/A"}${sensitivity}`;
}

function formatCategories(categories) {
  if (!categories || categories.length === 0) return "N/A";
  return categories
    .map(cat => `${cat.name}${cat.example ? ` (e.g., ${cat.example})` : ""}`)
    .join(", ");
}

function toggleTable(packageName) {
  const table = document.getElementById(`table-${packageName}`);
  table.style.display = table.style.display === "none" ? "table" : "none";
}

function applyFilters() {
  const showAdded = document.getElementById("filter-added").checked;
  const showChanged = document.getElementById("filter-changed").checked;
  const showDeleted = document.getElementById("filter-deleted").checked;

  const filteredData = apiData.filter(item => {
    if (item.change_type === "Addition" && showAdded) return true;
    if (item.change_type === "Change" && showChanged) return true;
    if (item.change_type === "Deletion" && showDeleted) return true;
    return false;
  });

  populatePackages(filteredData);
}

// Load data and initialize the page
let apiData = [];
fetch('changes.json')
  .then(response => response.json())
  .then(data => {
    apiData = assignIds(data);
    populatePackages(apiData);
  })
  .catch(error => console.error("Error loading data:", error));
