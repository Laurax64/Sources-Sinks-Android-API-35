fetch('changes.json')
.then(response => {
  if (!response.ok) {
    throw new Error('Failed to load JSON file');
  }
  return response.json();
})
.then(data => {
  // Aggregate data for chart
  const counts = {
    "Sensitive Sources": 0,
    "Sensitive Sinks": 0,
    "Non-Sensitive Changes": 0
  };

  data.forEach(item => {
    if (item.class === "Sensitive Source") counts["Sensitive Sources"]++;
    else if (item.class === "Sensitive Sink") counts["Sensitive Sinks"]++;
    else if (item.class === "Non-Sensitive") counts["Non-Sensitive Changes"]++;
  });

  // Prepare chart labels and values
  const labels = Object.keys(counts);
  const values = Object.values(counts);

  // Create bar chart
  new Chart(document.getElementById('statistics-chart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Changes',
        data: values,
        backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB'], // Colors for each bar
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
          title: {
            display: true,
            text: 'Count'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Category'
          }
        }
      }
    }
  });
})
.catch(error => {
  console.error('Error loading or processing JSON:', error);
});