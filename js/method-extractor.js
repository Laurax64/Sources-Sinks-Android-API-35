/**
 * Checks if a type is sensitive for data_transmitted
 * @param {string} type - The type to check
 * @returns {boolean} - True if the type is sensitive, false otherwise
 */
function isPossiblySensitiveForTransmission(type) {
    const possiblySensitivTypes = ["byte", "short", "int", "long", "float", "double", "char", "boolean"];
    return  possiblySensitivTypes.includes(type);
}

function getDataTransmitted(parameters) {
    const parameterTypes = parameters.split(",").map(param => param.trim().split(" ")[0]);

    const dataTransmitted = [];
    parameterTypes.forEach(type => {
        if (type && !["void", "boolean", "int", "long", "String", "float", "double", "char"].includes(type)) {
            dataTransmitted.push({
                type: type,
                description: `A ${type} into the application code`,
                possibly_sensitive: isPossiblySensitiveForTransmission(type),
                destinations: [{
                    resource: "Application code",  // Default assumption
                    accessible_to_third_parties: false  // Default assumption
                }]
            });
        }
    });
    
    return dataTransmitted;
}

function extractFullyQualifiedName(className, imports, packageName) {
    // Check if class is explicitly imported
    const explicitImport = imports.find((imp) => imp.endsWith(`.${className}`));
    if (explicitImport) {
        return explicitImport;
    }

    // Check for wildcard imports (e.g., java.io.*)
    const wildcardImport = imports.find((imp) => imp.endsWith(".*"));
    if (wildcardImport) {
        return `${wildcardImport.replace(".*", "")}.${className}`;
    }

    // Default to package if no imports are found
    if (packageName) {
        return `${packageName}.${className}`;
    }

    // If not explicitly imported or in package, do not qualify
    return className;
}

function getDataReturned(type) {
    // If the return type exists and is a custom class, add it to data_returned
    if (type && !["void", "boolean", "int", "long", "String", "float", "double", "char"].includes(type)) {
        return [{
            type: type,
            description: `An object of type ${type} that might contain sensitive data, but is not sensitive itself`,
            possibly_sensitive: isPossiblySensitive(type)
        }];
    }
    return [];
}

/**
 * Determines if a type could be sensitive
 * @param {string} type - The type to check
 * @returns {boolean} - True if the type is possibly sensitive, false otherwise
 *
 */ 
function isPossiblySensitive(type) {
    const possiblySensitivTypes = ["byte", "short", "int", "long", "float", "double", "char", "boolean"];
    return  possiblySensitivTypes.includes(type);
}

function extractMethodHeaders(javaCode) {
    // Extract package name
    const packageMatch = javaCode.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : null;

    // Extract import statements
    const importMatches = [...javaCode.matchAll(/import\s+([\w.*]+);/g)];
    const imports = importMatches.map((match) => match[1]);

    // Remove single-line and multi-line comments
    const cleanedCode = javaCode
        .replace(/\/\/.*/g, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

    // Regex pattern to match method headers
    const methodPattern = /(?<modifiers>\b(public|private|protected|static|final|synchronized|native|\s)+\b)\s*(?<returnType>[\w<>\[\]]+)\s+(?<methodName>[\w<>]+)\s*\((?<parameters>[^)]*)\)\s*(?<exceptions>(throws\s+[\w<>\[\],\s]+)?)\s*{/g;
    const matches = cleanedCode.matchAll(methodPattern);

    const methods = [];
    for (const match of matches) {
        const { returnType, methodName, parameters } = match.groups;

        // Resolve fully qualified name for the return type, exclude built-ins
        const fullyQualifiedReturnType = extractFullyQualifiedName(returnType.trim(), imports, packageName);

        methods.push({
            methodSignature: `${returnType.trim()} ${methodName.trim()}(${parameters.trim()})`,
            fullyQualifiedReturnType: fullyQualifiedReturnType,
            dataReturned: getDataReturned(fullyQualifiedReturnType),
            dataTransmitted: getDataTransmitted(parameters.trim())
        });
    }
    return methods;
}

function formatMethodsAsJson(methodHeaders) {
    return methodHeaders.map(method => ({
        code: method.methodSignature,
        code_long: method.fullyQualifiedReturnType
            ? method.methodSignature.replace(method.methodSignature.split(" ")[0], method.fullyQualifiedReturnType)
            : method.methodSignature,
        link: "",
        class: "Non-Sensitive",
        category: "",
        change_type: "Addition",
        data_returned: method.dataReturned,
        data_transmitted: method.dataTransmitted
    }));
}



function processJavaCode() {
    const javaCode = document.getElementById("javaCode").value;
    if (!javaCode.trim()) {
        document.getElementById("outputJson").textContent = "Please paste some Java code to process.";
        return;
    }

    try {
        const methodHeaders = extractMethodHeaders(javaCode);
        const formattedJson = formatMethodsAsJson(methodHeaders);
        document.getElementById("outputJson").textContent = JSON.stringify(formattedJson, null, 4);
    } catch (error) {
        document.getElementById("outputJson").textContent = `Error: ${error.message}`;
    }
}
