/**
 * Exports the current data in changes.json to FlowDroid format as a text file.
 */
function exportFlowDroid() {
  fetch('data/json/changes.json')
    .then(response => response.json())
    .then(data => {
      const parsedData = parseApiData(data)
      const methodAnnotations = groupByCodeLong(parsedData)
      const formattedData = formatFlowDroidAnnotations(methodAnnotations)
      saveToFile(formattedData, 'sources-sinks-flowdroid')
    })
}

/**
 * Groups methods by their codeLong and determines their FlowDroid annotation (_SOURCE_, _SINK_, or _BOTH_),
 * while including the class or interface import.
 * 
 * @param {Array} parsedData The parsed changes
 * @returns {Object} An object mapping classTypes to codeLong and classOrInterfaceImport
 */
function groupByCodeLong(parsedData) {
  const changes = {}

  parsedData.forEach(implementedMethod => {
    const classType = { "Sensitive Source": "_SOURCE_", "Sensitive Sink": "_SINK_" }[implementedMethod.class] || null
    if (classType) {
      const key = `${implementedMethod.classOrInterfaceImport}.${implementedMethod.codeLong}`
      if (!changes[key]) {
        changes[key] = {
          classTypes: new Set(),
          classOrInterfaceImport: implementedMethod.classOrInterfaceImport,
          codeLong: implementedMethod.codeLong
        }
      }
      changes[key].formatedChanges.add(classType)
    }
  })

  return changes
}

/**
 * Formats the grouped formatedChanges into FlowDroid's required text format, including classOrInterfaceImport names.
 * 
 * @param {Object} An object mapping classTypes to codeLong and classOrInterfaceImport
 * @returns {string} A formatted string for FlowDroid output.
 */
function formatFlowDroidAnnotations(changes) {
  return Object.entries(changes)
    .map(([, { codeLong, classOrInterfaceImport, formatedChanges: classTypes }]) => {
      const classType = classTypes.has("_SOURCE_") && classTypes.has("_SINK_") ? "_BOTH_" : [...classTypes][0];
      return `<${classOrInterfaceImport}: ${codeLong}> -> ${classType}`;
    }).join('\n');
}


/**
 * Saves the formatted text to a file and triggers its download.
 * 
 * @param {string} content - The text content to save.
 * @param {string} filenameBase - The base name for the file.
 */
function saveToFile(content, filenameBase) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]  // Format: YYYYMMDD_HHMMSS
  const filename = `${filenameBase}_${timestamp}.txt`
  const blob = new Blob([content], { type: 'text/plain' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
