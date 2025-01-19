/**
 * Processes the Java code entered in the input field, extracting the change information and formatting it as JSON.
 * Displays the formatted JSON or an error message in the output.
 * 
 * @returns {void} - No return value. This function updates the DOM with the formatted JSON or error message.
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
    const cleanedJavaCode = replaceCommentWithSpaces(javaCode)
    const classOrInterfaceName = extractClassOrInterfaceName(cleanedJavaCode);
    const changesInformation = extractChangesInformation(cleanedJavaCode, baseUrl, classOrInterfaceName)
    const formattedJson = formatAsJson(classOrInterfaceName, changesInformation);

    document.getElementById("outputJson").textContent = JSON.stringify(formattedJson, null, 4);
}

/**
 * Replaces lines containing comments with parentheses with spaces,
 * preserving line numbers and line lengths.
 * 
 * @param {string} javaCode - The Java code to process.
 * @returns {string} - The modified Java code with comment lines replaced by spaces.
 */
function replaceCommentWithSpaces(javaCode) {
    const lines = javaCode.split("\n");
    const updatedLines = lines.map(line => {

        // Check if the line contains a single-line comment with parentheses
        if (/^\s*\/\/.*\([^\)]*\)/.test(line)) {
            console.log("single line comment:")
            console.log(line)

            return " ".repeat(line.length); // Replace entire line with spaces
        }

        // Check if the line contains a multi-line comment with parentheses
        if (/\/\*.*\([^\)]*\).*?\*\//.test(line)) {
            console.log("multiline comment:")
            console.log(line)
            return " ".repeat(line.length); // Replace entire line with spaces
        }

        // If line doesn't match, keep it as is
        return line;
    });

    // Rejoin the lines to form the modified code
    return updatedLines.join("\n");
}



/**
 * Extracts the class or interface name from the given Java code.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @returns {string} - The class or interface name
 */
function extractClassOrInterfaceName(javaCode) {
    const match = javaCode.match(/\b(class|interface)\s+([A-Z][a-zA-Z]*)/);
    return match[2]
}

/**
 * Extracts the code, codeLong, lineLink, dateReturned and dataTransmitted for each change.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @param {string} baseUrl - The base URL for generating method links.
 * @param {string} classOrInterfaceName - The name of the Java class.
 * @returns {Array} - An array of method objects with method details like code, data returned, etc.
 */
function extractChangesInformation(javaCode, baseUrl, classOrInterfaceName) {
    const packageName = getPackageName(javaCode);
    const imports = getImports(javaCode);
    const changesInformations = extractChangesInformations(javaCode)

    const methods = [];
    for (const header of changesInformations) {
        const returnType = (header.groups.returnType ?? "").trim();
        const changeName = header.groups.changeName.trim();
        const parametersRaw = header.groups.parameters.trim();
        const parameters = parametersRaw
            .split(',')
            .map(param => {
                const parts = param.trim().split(/\s+/).map(part => part.trim()).filter(word => !word.includes("@"))
                // Return only the parameter Type
                return parts[0]
            })
        methods.push({
            code: `${returnType} ${changeName}(${parameters.join(", ")})`.trim(),
            codeLong: getCodeLong(returnType ?? "", changeName, parameters, imports, packageName, classOrInterfaceName),
            lineLink: getMethodLink(baseUrl, javaCode, header.index),
            dataReturned: getDataReturned(returnType, imports, packageName, changeName, classOrInterfaceName),
            dataTransmitted: []
        });
    }
    return methods;
}

/**
 * Extracts headers from the Java code.
 * 
 * @param {string} javaCode - The Java code.
 * @returns {Array} - An array of objects representing matched method headers with groups for the return type, method name and parameters
 */
function extractChangesInformations(javaCode) {
    const constructorMatch = [
        /(?<accessModifier>public|private|protected|default)\s/,  // Access modifier (optional)
        /(?<changeName>[A-Z]\w+)/,                                // Constructor name
        /\((?<parameters>[^)]*)\)/,                               // Parameters (anything inside parentheses)
    ];

    const methodMatch = [
        /(?<accessModifier>public|private|protected|default)?\s*/,     // Access modifier (optional)
        /(?<returnType>\w+(\<[^>]+\>)?(\[\])*)\s+/,                    // Return type (basic types, generics, arrays)
        /(?<changeName>[a-z]\w+)/,                                     // Method name
        /\((?<parameters>[^)]*)\)/,                                    // Parameters (anything inside parentheses)
        /(?<exceptions>\s+throws\s+[\w.,<> ]+)?/,                      // Exceptions (optional)
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
 * @param {string} returnType - The return type of a method.
 * @param {Array} imports - The list of imports.
 * @param {string} packageName - The name of the package.
 * @param {string} classOrInterfaceName - The name of the class containing the method.
 * @returns {Array} - An array of objects representing the data returned.
 */
function getDataReturned(returnType, imports, packageName, changeName, classOrInterfaceName) {
    const commonCriticalTypes = [
        "byte", "Byte",
        "short", "Short",
        "int", "Integer",
        "long", "Long",
        "float", "Float",
        "double", "Double",
        "char", "Character",
        "boolean", "Boolean",
        "String"
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
        else if (!commonCriticalTypes.includes(returnType)) {
            description  = `An object of type ${returnType} that might contain sensitive data, but is not sensitive itself`
        }
        
        dataReturned.push({
            type: extractFullyQualifiedName(returnType, imports, classOrInterfaceName, packageName),
            description: description ,
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
        String: "java.lang.String",
        Object: "java.lang.Object",
        Integer: "java.lang.Integer",
        Intent: "android.content.Intent",
        Instant: "java.time.Instant",
        Exception: "java.lang.Exception",
        Builder: `${packageName}.${classOrInterfaceName}.Builder`
    };

    var fullyQualifiedName = name.replace(
        /\b(Map|List|String|Object|Integer|Intent|Instant|Exception|Builder)\b/g,
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
        implemented_methods: changesInformation.map(change => ({
            code: change.code,
            codeLong: change.codeLong,
            link: change.lineLink,
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