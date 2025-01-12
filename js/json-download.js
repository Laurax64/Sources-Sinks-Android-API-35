/**
 * Triggers the download of the current `apiData` as a JSON file named 'changes.json'.
 */
function downloadJSON() {
    // URL to your JSON file (ensure it is accessible via a URL)
    const fileUrl = '/data/json/changes.json'; // Adjust this URL as needed
  
    fetch(fileUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Format the JSON with indentation (2 spaces for better readability)
        const formattedJson = JSON.stringify(data, null, 2);
  
        // Create a Blob from the formatted JSON data
        const jsonBlob = new Blob([formattedJson], { type: 'application/json' });
        
        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(jsonBlob);
        link.download = 'changes.json'; // The filename for the downloaded file
        link.click(); // Programmatically click the link to start download
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
  }
  