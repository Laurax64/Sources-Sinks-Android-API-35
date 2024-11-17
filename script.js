document.addEventListener("DOMContentLoaded", function() {
  fetch('changes.json')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('changes-container');
      data.forEach(change => {
        const changeElement = document.createElement('div');
        changeElement.classList.add('change');
        
        // Heading (ID and Import)
        const heading = document.createElement('div');
        heading.classList.add('heading');
        heading.textContent = `ID: ${change.id} - Import: ${change.import}`;
        changeElement.appendChild(heading);
        
        // Code and Link
        const codeLink = document.createElement('div');
        codeLink.innerHTML = `<strong>Code:</strong> <code>${change.code}</code> <a href="${change.link}" target="_blank" class="link">View Documentation</a>`;
        changeElement.appendChild(codeLink);
        
        // Class
        const classElement = document.createElement('div');
        classElement.innerHTML = `<strong>Class:</strong> ${change.class}`;
        changeElement.appendChild(classElement);
        
        // Categories
        if (change.categories) {
          const categories = document.createElement('div');
          categories.innerHTML = `<strong>Categories:</strong> ${change.categories.map(c => c.name).join(', ')}`;
          changeElement.appendChild(categories);
        }
        
        // Change Type
        const changeType = document.createElement('div');
        changeType.innerHTML = `<strong>Change Type:</strong> ${change.change_type}`;
        changeElement.appendChild(changeType);
        
        // Data Returned
        const dataReturned = document.createElement('div');
        dataReturned.innerHTML = `<strong>Data Returned:</strong> ${change.data_returned.map(d => `${d.type}${d.possibly_sensitive ? ' (Sensitive)' : ''}`).join(', ')}`;
        changeElement.appendChild(dataReturned);
        
        // Append change element to container
        container.appendChild(changeElement);
      });
    })
    .catch(error => console.error('Error loading changes.json:', error));
});
