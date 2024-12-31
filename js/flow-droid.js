

/**
 * Exports the current data in changes.json to FlowDroid format as a text file.
 */
function exportFlowDroid() {
    fetch('data/changes.json')
      .then((response) => response.json())
      .then((data) => {
        const parsedData = parseApiData(data);
        const methodAnnotations = groupByCodeLong(parsedData);
        const flowDroidFormatted = formatFlowDroidAnnotations(methodAnnotations);
        saveToFile(flowDroidFormatted, 'sources-sinks-flowdroid');
      })
      .catch((error) => {
        console.error('Error fetching changes.json:', error);
        alert('Failed to export FlowDroid data. Please check the console for details.');
      });
  }
  
/**
 * Groups methods by their `code_long` and determines their FlowDroid annotation (_SOURCE_, _SINK_, or _BOTH_),
 * while including package names.
 * 
 * @param {Array} parsedData - The parsed data containing methods.
 * @returns {Object} - An object mapping unique keys to their respective annotations and package names.
 */
function groupByCodeLong(parsedData) {
    const annotations = {};
  
    parsedData.forEach(item => {
      const annotation = item.class === "Sensitive Source" ? "_SOURCE_" :
        item.class === "Sensitive Sink" ? "_SINK_" : null;
  
      if (annotation) {
        const key = `${item.package}.${item.code_long}`; // Unique key includes package and method
        if (!annotations[key]) {
          annotations[key] = { annotations: new Set(), packageName: item.package, codeLong: item.code_long };
        }
        annotations[key].annotations.add(annotation);
      }
    });
  
    return annotations;
  }  
  
/**
 * Formats the grouped annotations into FlowDroid's required text format, including package names.
 * 
 * @param {Object} methodAnnotations - An object mapping `code_long` to annotations, with package names.
 * @returns {string} - A formatted string for FlowDroid output.
 */
function formatFlowDroidAnnotations(methodAnnotations) {
    return Object.entries(methodAnnotations).map(([key, value]) => {
      const { codeLong, packageName } = value;
      const annotation = value.annotations.size > 1 ? "_BOTH_" : [...value.annotations][0];
      return `<${packageName}: ${codeLong}> -> ${annotation}`;
    }).join('\n');
  }
  
  

/**
 * Saves the formatted text to a file and triggers its download.
 * 
 * @param {string} content - The text content to save.
 * @param {string} filenameBase - The base name for the file.
 */
function saveToFile(content, filenameBase) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]; // Format: YYYYMMDD_HHMMSS
    const filename = `${filenameBase}_${timestamp}.txt`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
  