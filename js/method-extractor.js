/**
 * A list of access modifiers in Java.
 * 
 * @type {Array}
 */
const accessModifiers = ["public", "private", "protected"];

/**
 * Extracts data returned from the return type of a method.
 * 
 * @param {string} returnType - The return type of a method.
 * @param {Array} imports - The list of imports.
 * @param {string} packageName - The name of the package.
 * @param {string} className - The name of the class containing the method.
 * @returns {Array} - An array of objects representing the data returned.
 */
function getDataReturned(returnType, imports, packageName, className) {

    const dataReturned = [];
    if (returnType && returnType !== "void" && !accessModifiers.some(modifier => returnType == modifier)) {
        dataReturned.push({
            type: extractFullyQualifiedName(returnType, imports, returnType, packageName, className),
            description: `An object of type ${returnType} that might contain sensitive data, but is not sensitive itself`,
            possibly_sensitive: false
        });
    }
    return dataReturned;
}

/**
 * Extracts method information from the Java code.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @param {string} baseUrl - The base URL for generating method links.
 * @param {string} className - The name of the Java class.
 * @returns {Array} - An array of method objects with method details like code, data returned, etc.
 */
function extractMethodInformation(javaCode, baseUrl, className) {
    const packageName = getPackageName(javaCode);
    const imports = getImports(javaCode);
    const cleanedCode = cleanCode(javaCode);
    const methodHeaders = getMethodHeaders(cleanedCode);

    const methods = [];
    for (const match of methodHeaders) {
        const { returnType, methodName, parameters } = match.groups;
        methods.push({
            code: `${returnType} ${methodName}(${parameters})`,
            codeLong: getCodeLong(returnType, methodName, parameters, imports, packageName, className),
            lineLink: getMethodLink(baseUrl, javaCode, match.index),
            dataReturned: getDataReturned(returnType, imports, packageName, className),
            dataTransmitted: []
        });
    }
    return methods;
}

/**
 * Removes the names of the parameters from a parameter list, leaving only the types.
 * 
 * @param {string} parameters - The list of method parameters as a string.
 * @returns {string} - The parameter list with only the types, without the parameter names.
 */
function removeParameterNames(parameters) {
    return parameters.replace(/\s+\w+(?=\s*(?:,|\)|$))/g, ""); 
}

/**
 * Extracts the fully qualified name of a type.
 * 
 * @param {string} shortName - The short name of the type to get the fully qualified name for.
 * @param {Array} imports - The list of imports.
 * @param {string} classType - The type of the class.
 * @param {string} packageName - The name of the package.
 * @returns {string} - The fully qualified name of the class.
 */
function extractFullyQualifiedName(shortName, imports, classType, packageName) {
    var trimmedShortName = shortName.trim()
        .replace("Map", "java.util.Map")  
        .replace("List", "java.util.List") 
        .replace("String", "java.lang.String") 
        .replace("Object", "java.lang.Object") 
        .replace("Integer", "java.lang.Integer")  
        .replace("Intent", "android.content.Intent")
        .replace("Instant", "java.time.Instant")
        .replace("Exception", "java.lang.Exception")

    const explicitImport = imports.find((imp) => imp.endsWith(`.${trimmedShortName}`));
    if (explicitImport) {
        return explicitImport
    }

    const wildcardImport = imports.find((imp) => imp.endsWith(".*"));
    if (wildcardImport) {
        return `${wildcardImport.replace(".*", "")}.${trimmedShortName}`;
    }

    if (trimmedShortName === classType) {
        return `${packageName}.${trimmedShortName}`;
    }

    return trimmedShortName.trim();
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
 * Cleans the Java code by removing comments and annotations.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @returns {string} - The cleaned code with comments and annotations removed.
 */
function cleanCode(javaCode) {
    return javaCode
        .replace(/\/\*[\s\S]*?\*\//g, match => " ".repeat(match.length))  // Multi-line comments
        .replace(/\/\/[^\n]*/g, match => " ".repeat(match.length))  // Single-line comments
        .replace(/@\S+/g, match => " ".repeat(match.length))  // Annotations      
        .replace(/new[\s\S]*?/g, match => " ".repeat(match.length)) // Lines with new keyword
}

/**
 * Extracts the class name from the Java code.
 * 
 * @param {string} javaCode - The source code of the Java class.
 * @returns {string} - The class name, or "UnknownClass" if not found.
 */
function getClassName(javaCode) {
    const cleanedCode = cleanCode(javaCode);
    const classMatch = cleanedCode.match(/\bclass\s+(\w+)/);
    return classMatch ? classMatch[1] : "UnknownClass";
}

/**
 * Extracts method headers from the cleaned Java code.
 * 
 * @param {string} cleanedCode - The cleaned Java code.
 * @returns {Array} - An array of objects representing matched method headers with groups for access modifiers, return type, method name, parameters, and exceptions.
 */
function getMethodHeaders(cleanedCode) {
    const methodPatternParts = [
        /(?<accessModifier>public|private|protected|default)?\s*/,     // Access modifier (optional)
        /(?<returnType>\w+(\<[^>]+\>)?(\[\])*)\s+/,                    // Return type (basic types, generics, arrays)
        /(?<methodName>\w+)\s*/,                                       // Method name
        /\((?<parameters>[^)]*)\)/,                                    // Parameters (anything inside parentheses)
        /(?<exceptions>\s+throws\s+[\w.,<> ]+)?/,                      // Exceptions (optional)
    ];
        
    const methodPattern = new RegExp(methodPatternParts.map(part => part.source).join(''), 'g');
    
    return [...cleanedCode.matchAll(methodPattern)];
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
 * Formats the extracted method information as a JSON object.
 * 
 * @param {string} className - The name of the class.
 * @param {Array} methodHeaders - An array of method headers extracted from the Java code.
 * @param {string} packageName - The name of the package.
 * @param {Array} imports - A list of import statements.
 * @returns {Object} - A JSON object containing the class name and method details.
 */
function formatAsJson(className, methodHeaders) {
    return {
        name: className,
        implemented_methods: methodHeaders.map(method => ({
            code: method.code.replace(/ +/g, " ").replace(/\( +/g,"(").replace(/\n +/g, " ").replace(/\b(public|private|protected) /g, ""),
            codeLong: method.codeLong.replace(/\b(public|private|protected) /g, ""),
            link: method.lineLink,
            class: "Non-Sensitive",
            category: "",
            changeType: "Addition",
            dataReturned: method.dataReturned,
            dataTransmitted: method.dataTransmitted
        }))
    };
}

/**
 * Generates a fully qualified method signature with return type, method name, and fully qualified parameter types.
 * 
 * @param {string} returnType - The return type of the method.
 * @param {string} name - The name of the method.
 * @param {string} parameters - The list of method parameters.
 * @param {Array} imports - A list of imports from the Java code.
 * @param {string} packageName - The name of the package.
 * @param {string} className - The name of the class.
 * @returns {string} - A fully qualified method signature.
 */
function getCodeLong(returnType, name, parameters, imports, packageName, className) {
    const fullyQualifiedReturnType = extractFullyQualifiedName(returnType, imports, className, packageName)
    const fullyQualifiedParameters = removeParameterNames(extractFullyQualifiedName(parameters, imports, className, packageName))
    return fullyQualifiedReturnType + " " + name + "(" + fullyQualifiedParameters + ")";
}

/**
 * Processes the Java code entered in the input field, extracting method information and formatting it as JSON.
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
    try {
        const packageName = getPackageName(javaCode);
        const className = getClassName(javaCode);
        const methodHeaders = extractMethodInformation(javaCode, baseUrl, className)
        const imports = getImports(javaCode);
        const formattedJson = formatAsJson(className, methodHeaders);

        document.getElementById("outputJson").textContent = JSON.stringify(formattedJson, null, 4);
    } catch (error) {
        document.getElementById("outputJson").textContent = `Error: ${error.message}\n${error.stack}`;
    }
}
