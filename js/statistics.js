function showChart() {
  fetch('data/changes.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load JSON file');
      }
      return response.json();
    })
    .then(data => {
      // Parse the data using the parseApiData function
      const parsedData = parseApiData(data);

      // Initialize the counts for each category
      const counts = {
        "Sensitive Sources": 0,
        "Sensitive Sinks": 0,
        "Non-Sensitive Changes": 0
      };

      // Count the occurrences of each class category
      parsedData.forEach(item => {
        if (item.class === "Sensitive Source") {
          counts["Sensitive Sources"]++;
        } else if (item.class === "Sensitive Sink") {
          counts["Sensitive Sinks"]++;
        } else if (item.class === "Non-Sensitive") {
          counts["Non-Sensitive Changes"]++;
        }
      });

      // Prepare the chart data
      const labels = Object.keys(counts);
      const values = Object.values(counts);

      // Create a bar chart using Chart.js
      new Chart(document.getElementById('statistics-chart'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Number of Changes',
            data: values,
            backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB'],
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Count' }
            },
            x: {
              title: { display: true, text: 'Category' }
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Error loading or processing JSON:', error);
    });
}

function toggleChartVisibility() {
  const chartContainer = document.getElementById('chart-container');
  const toggleButton = document.getElementById('toggle-chart-button');
  if (chartContainer.style.display === 'none' || chartContainer.style.display === '') {
      chartContainer.style.display = 'block';
      toggleButton.textContent = 'Hide Statistics';
      showChart();  // Re-show the chart when toggling visibility
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
