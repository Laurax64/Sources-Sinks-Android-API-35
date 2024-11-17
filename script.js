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
  container.innerHTML = ""; 

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
      <th>Code</th>
      <th>Change Type</th>
      <th>Data Returned</th>
      <th>Data Accepted</th>
      <th>Categories</th>
      <th>Select</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    apis.forEach(api => {
      const row = document.createElement("tr");

      row.innerHTML = `
      <td><input type="checkbox" data-id="${api.id}"></td>
      <td><a href="${api.link}" target="_blank">${api.code}</a></td>
      <td>${api.change_type || "N/A"}</td>
      <td>${formatData(api.data_returned)}</td>
      <td>${formatData(api.data_accepted)}</td>
      <td>${formatCategories(api.categories)}</td>
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
  table.classList.toggle("hidden");
}

function applyFilters() {
  const changeType = document.getElementById("change-type").value;
  const selectedClass = document.getElementById("class").value;
  const selectedCategory = document.getElementById("category").value;

  const filteredData = apiData.filter(item => {
    const matchesChangeType = !changeType || item.change_type === changeType;
    const matchesClass = !selectedClass || item.class === selectedClass;
    const matchesCategory = !selectedCategory || 
      (item.categories && item.categories.some(cat => cat.name === selectedCategory));

    return matchesChangeType && matchesClass && matchesCategory;
  });

  populatePackages(filteredData);
}


// Load data and initialize the page
let apiData = [];
fetch('changes.json')
  .then(response => response.json())
  .then(data => {
    populatePackages(apiData);
  })
  .catch(error => console.error("Error loading data:", error));
