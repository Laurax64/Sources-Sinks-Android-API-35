// Define the categories once
const categories = [
  "Location", "Personal Info", "Financial Info", "Health and Fitness", "Messages",
  "Photos and Videos", "Audio Files", "Files and Docs", "Calendar", "Contacts",
  "App Activity", "Web Browsing", "App Info and Performance", "Device or other IDs", "Undefined"
];

// Create a function to generate the counts structure
const createCounts = () => Object.fromEntries(categories.map(category => [category, 0]));

function showChart() {
  const counts = createCategoryCounts(apiData);

  const classes = Object.keys(counts);
  const categories = Object.keys(counts["Sensitive Source"]);

  const dataset = generateDataset(categories, classes, counts);

  new Chart(document.getElementById('statistics-chart'), {
    type: 'bar',
    data: {
      labels: classes,
      datasets: dataset,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true
        }
      },
    }
  });
}

function showPieChart() {
  const counts = createCategoryCounts(apiData);

  // Aggregate total counts for each category across all classes
  const totalCounts = categories.map(category => {
    return Object.keys(counts).reduce((sum, classType) => sum + counts[classType][category], 0);
  });

  new Chart(document.getElementById('statistics-chart'), {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        data: totalCounts,
        backgroundColor: categories.map(getColorForCategory)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const category = tooltipItem.label;
              const value = tooltipItem.raw;
              return `${category}: ${value}`;
            }
          }
        }
      }
    }
  });
}


/**
 * Counts each class and category combination in the data.
 * 
 * @param {object} apiData The data to count classes and categories for.
 * @returns {object} An object containing the counts.
 */
function createCategoryCounts(apiData) {
  const counts = {
    "Sensitive Source": createCounts(),
    "Sensitive Sink": createCounts(),
    "Non-Sensitive": createCounts()
  };

  apiData.forEach(item => {
    const category = item.category || "Undefined";
    if (counts.hasOwnProperty(item.class)) {
      counts[item.class][category]++;
    } else {
      counts["Non-Sensitive"]["Undefined"]++;
    }
  });
  return counts;
}

/**
 * Generate a dataset for the bar chart from the counts where the label is the category name 
 * and the data is the count for each class.
 * 
 * @param {*} categories The counted categories.
 * @param {*} classes The counted classes.
 * @returns The dataset for the bar chart.
 */
function generateDataset(categories, classes, counts) {
  const dataset =
    categories.map(category => {
      return {
        label: category,
        data: classes.map(classType => counts[classType][category]),
        backgroundColor: getColorForCategory(category)
      }
    });
  return dataset
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

/**
 * Toggles the visibility of the chart.
 */
function toggleChartVisibility() {
  const chartContainer = document.getElementById('chart-container');
  const toggleButton = document.getElementById('toggle-chart-button');
  if (chartContainer.style.display === 'none' || chartContainer.style.display === '') {
    chartContainer.style.display = 'block';
    toggleButton.textContent = 'Hide Statistics';
    showChart();
  } else {
    chartContainer.style.display = 'none';
    toggleButton.textContent = 'Show Statistics';
    const canvas = document.getElementById('statistics-chart');
    const chartInstance = Chart.getChart(canvas);
    if (chartInstance) {
      chartInstance.destroy();
    }
  }
}