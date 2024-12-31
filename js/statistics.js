const classes = ["Sensitive Source", "Sensitive Sink", "Non-Sensitive"]
const categories = [
  "Location", "Personal Info", "Financial Info", "Health and Fitness", "Messages",
  "Photos and Videos", "Audio Files", "Files and Docs", "Calendar", "Contacts",
  "App Activity", "Web Browsing", "App Info and Performance", "Device or other IDs", "Undefined"
];

const createCounts = () => Object.fromEntries(categories.map(category => [category, 0]));

function showSourcesChart() {
  const counts = createSourcesCounts(apiData);

  // Extract categories from the counts object
  const categories = Object.keys(counts["Sensitive Source"]);

  // Prepare the dataset for the chart
  const dataset = [{
    label: 'Sensitive Source',
    data: categories.map(category => counts["Sensitive Source"][category]),
    backgroundColor: categories.map(getColorForCategory)
  }];

  // Create the chart
  new Chart(document.getElementById('sources-chart'), {
    type: 'bar',
    data: {
      labels: categories,
      datasets: dataset,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false } 
      },
    }
  });
}

function showSinksChart() {
  const counts = createSinkCounts(apiData);

  // Extract categories from the counts object
  const categories = Object.keys(counts["Sensitive Sink"]);

  // Prepare the dataset for the chart
  const dataset = [{
    label: 'Sensitive Sink',
    data: categories.map(category => counts["Sensitive Sink"][category]),
    backgroundColor: categories.map(getColorForCategory)
  }];

  // Create the chart
  new Chart(document.getElementById('sinks-chart'), {
    type: 'bar',
    data: {
      labels: categories,
      datasets: dataset,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false } 
      },
    }
  });
}



function showClassesChart(){
  const classesCounts = createClassesCounts(apiData);

  const classes = Object.keys(classesCounts);
  const dataset = generateClassesDataset(classes, classesCounts);

  new Chart(document.getElementById('all-classes-chart'), {
    type: 'bar',
    data: {
      labels: classes,
      datasets: dataset,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false}
      },
    }
  });
}

function createSourcesCounts(apiData) {
  const counts = {
    "Sensitive Source": createCounts(),
  };

  apiData.forEach(item => {
    const category = item.category || "Undefined";
    if (item.class === "Sensitive Source") {
      counts["Sensitive Source"][category]++;
    }
  });
  return counts;
}

function createSinkCounts(apiData) {
  const counts = {
    "Sensitive Sink": createCounts(),
  };

  apiData.forEach(item => {
    const category = item.category || "Undefined";
    if (item.class === "Sensitive Sink") {
      counts["Sensitive Sink"][category]++;
    }
  });
  return counts;
}

function createClassesCounts(apiData) {
  const counts = {
    "Sensitive Source": 0,
    "Sensitive Sink": 0,
    "Non-Sensitive": 0
  };

  apiData.forEach(item => {
    if (counts.hasOwnProperty(item.class)) {
      counts[item.class]++;
    }
  });
  return counts;
}

function generateDataset(categories, classType, counts) {
  return categories.map(category => ({
    label: category,
    data: [counts[classType][category]], // Data should be an array
    backgroundColor: getColorForCategory(category)
  }));
}


function generateClassesDataset(classes, counts) {
  return [{
    data: classes.map(classType => counts[classType]),
    //backgroundColor: classes.map(getColorForClass)
  }];
}


/**
 * Gets the color for a specific category.
 * 
 * @param {string} category The category to get the color for.
 * @returns {string} The color for the category.
 */
function getColorForCategory(category) {
  const colorMap = {
    "Location": '#FF6384',
    "Personal Info": '#FFCE56',
    "Financial Info": '#36A2EB',
    "Health and Fitness": '#FF9F40',
    "Messages": '#4BC0C0',
    "Photos and Videos": '#FFCD56',
    "Audio Files": '#FF4C63',
    "Files and Docs": '#34B7FF',
    "Calendar": '#FF4081',
    "Contacts": '#6F8DFF',
    "App Activity": '#4CAF50',
    "Web Browsing": '#8C6F41',
    "App Info and Performance": '#FF5722',
    "Device or other IDs": '#8BC34A',
    "Category Unknown": '#ccf5ff'
  };
  return colorMap[category] || '#ccf5ff';
}

function getColorForClass(className) {
  const colorMap = {
    "Sensitive Source": '#FF6384', // Red
    "Sensitive Sink": '#36A2EB',   // Blue
    "Non-Sensitive": '#4BC0C0'     // Green
  };
  return colorMap[className] || '#cccccc'; // Default to light gray if class not found
}

/**
 * Toggles the visibility of the bar charts.
 */
function toggleChartVisibility() {
  const chartsWrapper = document.getElementById('charts-wrapper');
  const toggleButton = document.getElementById('toggle-chart-button');
  if (chartsWrapper.style.display === 'none' || chartsWrapper.style.display === '') {
    chartsWrapper.style.display = 'flex'; 
    showSourcesChart();
    showSinksChart();
    showClassesChart();
    toggleButton.textContent = 'Hide Statistics';
  } else {
    chartsWrapper.style.display = 'none';
    toggleButton.textContent = 'Show Statistics';
  }
}

