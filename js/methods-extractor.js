/**
 * Processes the Java code entered in the input field, extracting the change information and formatting it as JSON.
 */
function processJavaCode() {
    const javaCode = document.getElementById("javaCode").value;
    const baseUrl = document.getElementById("baseUrl").value;
    if (!javaCode) {
        document.getElementById("outputJson").textContent = "Please paste some Java code to process.";
        return;
    }
    if (!baseUrl) {
        document.getElementById("outputJson").textContent = "Please provide the base URL.";
        return;
    }
    const cleanedJavaCode = removeComments(javaCode)
    const classOrInterfaceName = extractClassOrInterfaceName(cleanedJavaCode);
    const changesInformation = extractChangesInformations(cleanedJavaCode, baseUrl, classOrInterfaceName)
    const formattedJson = formatAsJson(classOrInterfaceName, changesInformation);

    document.getElementById("outputJson").textContent = JSON.stringify(formattedJson, null, 4);
}

/**
 * Replaces all comments in the given Java code.
 * 
 * @param {string} javaCode The Java code to process
 * @returns {string} The given Java code without comments
 */
function removeComments(javaCode) {
    const lines = javaCode.split("\n");
    const updatedLines = lines.map(line => {

        // Check if the line starts with '\\' (escaped backslash)
        if (/^\s*\/\//.test(line)) {
            return " ".repeat(line.trim.length);
        }

        // Check if the line starts with '/*' (multi-line comment opening)
        if (/^\s*\/\*/.test(line)) {
            return " ".repeat(line.trim.length);
        }

        // Check if the line starts with '*' (multi-line comment continuation)
        if (/^\s*\*/.test(line)) {
            return " ".repeat(line.trim.length);
        }
        return line
    })

    // Rejoin the lines to form the modified code
    return updatedLines.join("\n")
}

/**
 * Extracts the class or interface name from the given Java code.
 * 
 * @param {string} javaCode The source code of the Java class.
 * @returns {string} The class or interface name
 */
function extractClassOrInterfaceName(javaCode) {
    const match = javaCode.match(/(class|interface)\s+([A-Z]\w*)/);
    return match[2]
}

/**
 * Extracts the code, codeLong, lineLink, dateReturned and dataTransmitted for each change.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @param {string} baseUrl - The base URL for generating method links.
 * @param {string} classOrInterfaceName - The name of the Java class.
 * @returns {Array} Objects containing the code, codeLong, link, dataReturned and dataTransmitted for each change
 */
function extractChangesInformations(javaCode, baseUrl, classOrInterfaceName) {
    const packageName = getPackageName(javaCode);
    const imports = getImports(javaCode);
    const headers = extractHeaders(javaCode, classOrInterfaceName)

    const changesInformations = [];
    for (const header of headers) {
        const returnType = (header.groups.returnType ?? "").trim()
        const changeName = header.groups.changeName
        const parametersRaw = header.groups.parameters
        const parameters = parametersRaw
            .split(',')
            .map(param => {
                const parts = param
                    .trim()         // Remove any leading/trailing whitespace from the parameter
                    .split(/\s+/)   // Split the parameter into parts based on whitespace
                    .map(part => part.trim())  // Remove any leading/trailing whitespace from each part
                    .filter(word => !word.includes("@"))   // Remove annotations
                return parts[0]
            })

        changesInformations.push({
            code: `${returnType} ${changeName}(${parameters.join(", ")})`.trim(),
            codeLong: getCodeLong(returnType ?? "", changeName, parameters, imports, packageName, classOrInterfaceName),
            link: getMethodLink(baseUrl, javaCode, header.index),
            dataReturned: getDataReturned(returnType, imports, packageName, changeName, classOrInterfaceName),
            dataTransmitted: []
        });
    }
    return changesInformations;
}

/**
 * Extracts the change headers from the Java code.
 * 
 * @param {string} javaCode The Java code.
 * @returns {Array} Headers object with groups for the return type, change name and parameters
 */
function extractHeaders(javaCode, classOrInterfaceName) {
    const constructorMatch = [
        /(?<accessModifier>public|private|protected|default)\s/,
        new RegExp(`(?<changeName>${classOrInterfaceName})`),
        /\((?<parameters>[^)]*)\)/,

    ];

    const methodMatch = [
        /(?<accessModifier>public|private|protected|default)\s/,
        /(?<returnType>\w+(\<[^>]+\>)?(\[\])*)\s+/,
        /(?<changeName>[a-z]\w+)/,
        /\((?<parameters>[^)]*)\)/,
        /(?<exceptions>\s+throws\s+[\w.,<> ]+)?/,
    ];

    const combinedPattern = [
        constructorMatch.map(part => part.source).join(''),
        methodMatch.map(part => part.source).join('')
    ].join('|');

    const pattern = new RegExp(combinedPattern, 'g');

    var headers = [...javaCode.matchAll(pattern)];

    return headers;
}




/**
 * Extracts data returned from the return type of a method.
 * 
 * @param {string} returnType - The return type of a method
 * @param {Array} imports - The list of imports
 * @param {string} packageName - The name of the package
 * @param {string} classOrInterfaceName - The name of the class containing the method
 * 
 * @returns {Array} - An array of objects representing the data returned
 */
function getDataReturned(returnType, imports, packageName, changeName, classOrInterfaceName) {
    const commonSensitiveTypes = [
        "byte", "Byte", "short", "Short", "int", "Integer", "long", "Long", "float", "Float", "double", "Double",
        "char", "Character", "boolean", "Boolean", "String"
    ]
    const dataReturned = [];
    if (returnType && returnType != "void") {
        var description = ""
        if (changeName == "hashCode") {
            description = "A hash code value"
        }
        else if (changeName == "equals") {
            description = `Whether the given object is equal to this ${classOrInterfaceName}`
        }
        else if (changeName == "describeContents") {
            description = `0 which indicates, that the contents are not meant to cross compilation boundaries`
        }
        else if (!commonSensitiveTypes.includes(returnType)) {
            description = `An object of type ${returnType} that does not contain sensitive data that can be accessed without calling another function`
        }

        dataReturned.push({
            type: extractFullyQualifiedName(returnType, imports, classOrInterfaceName, packageName),
            description: description,
            possibly_sensitive: false
        });
    }
    return dataReturned;
}


/**
 * Extracts the fully qualified name of a type.
 * 
 * @param {string} name - The short name of the type to get the fully qualified name for.
 * @param {Array} imports - The list of imports.
 * @param {string} classOrInterfaceName - The type of the class.
 * @param {string} packageName - The name of the package.
 * @returns {string} - The fully qualified name of the class.
 */
function extractFullyQualifiedName(name, imports, classOrInterfaceName, packageName) {

    if (name == classOrInterfaceName) {
        return `${packageName}.${classOrInterfaceName}`
    }

    const explicitImport = imports.find((imp) => imp.endsWith(`.${name}`));
    if (explicitImport) {
        return explicitImport;
    }

    const fullyQualifiedMap = {
        Map: "java.util.Map",
        List: "java.util.List",
        Collection: "java.util.Collection",
        Set: "java.util.Set",
        String: "java.lang.String",
        Object: "java.lang.Object",
        Integer: "java.lang.Integer",
        Long: "java.lang.Long",
        Intent: "android.content.Intent",
        Instant: "java.time.Instant",
        Exception: "java.lang.Exception",
        Context: "android.content.Context",
        Builder: `${packageName}.${classOrInterfaceName}.Builder`
    };

    var fullyQualifiedName = name.replace(
        /\b(Map|List|Collection|Set|String|Object|Integer|Long|Intent|Instant|Exception|Context|Builder)\b/g,
        match => fullyQualifiedMap[match]
    );

    return fullyQualifiedName;
}


/**
 * Extracts the package name from the Java code.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @returns {string | null} - The package name if found, otherwise null.
 */
function getPackageName(javaCode) {
    const packageMatch = javaCode.match(/package\s+([\w.]+);/);
    return packageMatch ? packageMatch[1] : null;
}

/**
 * Extracts all import statements from the Java code.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @returns {Array} - An array of import statements found in the Java code.
 */
function getImports(javaCode) {
    const importMatches = [...javaCode.matchAll(/import\s+([\w.*]+);/g)];
    return importMatches.map((match) => match[1]);
}

/**
 * Generates a link to the line number of a method in the Java code.
 * 
 * @param {string} baseUrl - The base URL for generating the method link.
 * @param {string} javaCode - The source code of the Java class.
 * @param {number} matchIndex - The match index of the method header in the cleaned code.
 * @returns {string} - A URL linking to the line number of the method.
 */
function getMethodLink(baseUrl, javaCode, matchIndex) {
    const lineNumber = calculateLineNumber(javaCode, matchIndex);
    return `${baseUrl};l=${lineNumber}`;
}

/**
 * Calculates the line number in the Java code corresponding to a match index.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @param {number} matchIndex - The match index to find the corresponding line number.
 * @returns {number} - The line number corresponding to the match index.
 */
function calculateLineNumber(javaCode, matchIndex) {
    const lines = javaCode.split("\n");
    let currentPos = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        currentPos += lines[lineNum].length + 1;
        if (currentPos > matchIndex) {
            return lineNum + 1;
        }
    }

    return -1;
}

/**
 * Formats the extracted method changeInformation as a JSON object.
 * 
 * @param {string} classOrInterfaceName - The name of the class.
 * @param {Array} changesInformation - An array of method headers extracted from the Java code.
 * @param {string} packageName - The name of the package.
 * @param {Array} imports - A list of import statements.
 * @returns {Object} - A JSON object containing the class name and method details.
 */
function formatAsJson(classOrInterfaceName, changesInformation) {
    return {
        name: classOrInterfaceName,
        implementedMethods: changesInformation.map(change => ({
            code: change.code,
            codeLong: change.codeLong,
            link: change.link,
            class: "Non-Sensitive",
            category: "",
            changeType: "Addition",
            dataReturned: change.dataReturned,
            dataTransmitted: change.dataTransmitted
        }))
    };
}

/**
 * Generates a fully qualified method signature with return type, method name, and fully qualified parameter types.
 * 
 * @param {string} returnType - The return type of the method.
 * @param {string} name - The name of the method.
 * @param {string[]} parameters - The list of method parameters.
 * @param {Array} imports - A list of imports from the Java code.
 * @param {string} packageName - The name of the package.
 * @param {string} classOrInterfaceName - The name of the class.
 * @returns {string} - A fully qualified method signature.
 */
function getCodeLong(returnType, name, parameters, imports, packageName, classOrInterfaceName) {
    const fullyQualifiedReturnType = extractFullyQualifiedName(returnType, imports, classOrInterfaceName, packageName)
    const fullyQualifiedParameters = parameters.map(parameter =>
        extractFullyQualifiedName(parameter, imports, classOrInterfaceName, packageName)
    ).join(", ")
    return (fullyQualifiedReturnType + " " + name + "(" + fullyQualifiedParameters + ")").trim();
}


function copyToClipboard() {
    const outputElement = document.getElementById('outputJson');
    const range = document.createRange();
    range.selectNode(outputElement);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
        document.execCommand('copy');
        alert('Output JSON copied to clipboard!');
    } catch (err) {
        alert('Failed to copy JSON to clipboard.');
    }

    window.getSelection().removeAllRanges();
}