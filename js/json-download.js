/**
 * Triggers the download of 'changes.json'.
 */
function downloadJSON() {

  fetch('data/json/changes.json')
    .then((response) => response.json())
    .then((json) => {
    
      const blob = new Blob([JSON.stringify(json, null, 4)], { type: 'application/json' });
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'changes.json'; 
      link.click(); 
      // Clean up the URL object
      URL.revokeObjectURL(link.href);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
}