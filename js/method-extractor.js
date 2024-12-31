const primitiveTypes = ["byte", "short", "int", "long", "float", "double", "char", "boolean"];

/**
 * Checks if a type is sensitive for data_transmitted
 * @param {string} type - The type to check
 * @returns {boolean} - True if the type is sensitive, false otherwise
 */
function isPossiblySensitiveForTransmission(type) {
    const possiblySensitivTypes = primitiveTypes + ["String"];
    return possiblySensitivTypes.includes(type);
}

/** 
 @todo add String as java.lang.String for code long and fix transmitted data
 */
function getDataTransmitted(parameters) {
    const parameterTypes = parameters.split(",").map(param => param.trim().split(" ")[0]);
    const dataTransmitted = [];
    parameterTypes.forEach(type => {
        if (type && !["void", "boolean", "int", "long", "float", "double", "char"].includes(type)) {
            dataTransmitted.push({
                type: type,
                description: `A ${type} into the application code`,
                possibly_sensitive: isPossiblySensitiveForTransmission(type),
                destinations: [{
                    resource: "Application code",
                    accessible_to_third_parties: false
                }]
            });
        }
    });
    return dataTransmitted;
}

function extractFullyQualifiedName(className, imports, packageName) {
if (primitiveTypes.includes(className)) {
    return className;
}
const explicitImport = imports.find((imp) => imp.endsWith(`.${className}`));
if (explicitImport) {
    return explicitImport;
}
if (className === "String") {
    return "java.lang.String";
}
if (className.startsWith("List")) {
    return `java.util.${className}`;
}
// Default to package if no imports are found
if (packageName) {
    return `${packageName}.${className}`;
}

// If not explicitly imported or in package, do not qualify
return className;
}

function getDataReturned(returnType) {
    const dataReturned = [];
    if (returnType && returnType !== "void") {
        dataReturned.push({
            "type": returnType,
            "description": `An object of type ${returnType} that might contain sensitive data, but is not sensitive itself`,
            "possibly_sensitive": isPossiblySensitiveForTransmission(returnType)
        });
    }
    return dataReturned;
}

/**
 * Determines if a type could be sensitive
 * @param {string} type - The type to check
 * @returns {boolean} - True if the type is possibly sensitive, false otherwise
 *
 */
function isPossiblySensitive(type) {
    const possiblySensitivTypes = ["byte", "short", "int", "long", "float", "double", "char", "boolean"];
    return possiblySensitivTypes.includes(type);
}

/**
 * 
 * @todo fix parameters
 */

function extractMethodHeaders(javaCode, baseUrl) {
    const packageMatch = javaCode.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : null;

    const importMatches = [...javaCode.matchAll(/import\s+([\w.*]+);/g)];
    const imports = importMatches.map((match) => match[1]);

    const cleanedCode = javaCode
        .replace(/\/\/.*/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

    const classMatch = cleanedCode.match(/\bclass\s+(\w+)/);
    const className = classMatch ? classMatch[1] : "UnknownClass";

    const methodPattern = /(?<modifiers>\b(public|private|protected|static|final|synchronized|native|\s)+\b)\s*(?<returnType>[\w<>\[\]]+)\s+(?<methodName>[\w<>]+)\s*\((?<parameters>[^)]*)\)\s*(?<exceptions>(throws\s+[\w<>\[\],\s]+)?)\s*{/g;
    const matches = [...javaCode.matchAll(methodPattern)];

    const methods = [];
    for (const match of matches) {
        const { returnType, methodName, parameters } = match.groups;
        const fullyQualifiedReturnType = extractFullyQualifiedName(returnType.trim(), imports, packageName);

        const lineNumber = calculateLineNumber(javaCode, match.index);
        const methodLink = `${baseUrl};l=${lineNumber}`;

        // TODO Remove parameter name and annotation
        methods.push({
            methodSignature: `${returnType.trim()} ${methodName.trim()}(${parameters.trim()})`,
            fullyQualifiedReturnType: fullyQualifiedReturnType,
            lineLink: methodLink,
            dataReturned: getDataReturned(fullyQualifiedReturnType),
            dataTransmitted: getDataTransmitted(parameters.trim())
        });
    }

    return { className, methods };
}


function calculateLineNumber(javaCode, matchIndex) {
    const lines = javaCode.split("\n");
    let currentPos = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        currentPos += lines[lineNum].length + 1;  // +1 for newline character
        if (currentPos > matchIndex) {
            return lineNum + 1;  // Adding 1 for 1-based index
        }
    }

    return -1;  // If not found
}



function formatMethodsAsJson(className, methodHeaders) {
    return {
        name: className,
        implemented_methods: methodHeaders.map(method => ({
            code: method.methodSignature,
            code_long: method.fullyQualifiedReturnType
                ? method.methodSignature.replace(method.methodSignature.split(" ")[0], method.fullyQualifiedReturnType)
                : method.methodSignature,
            link: method.lineLink,
            class: "Non-Sensitive", // Default value
            category: "", // Default value
            change_type: "Addition", // Default value
            data_returned: method.dataReturned,
            data_transmitted: method.dataTransmitted
        }))
    };
}

function processJavaCode() {
    const javaCode = document.getElementById("javaCode").value;
    const baseUrl = document.getElementById("baseUrl").value;  // New input for base URL
    if (!javaCode.trim()) {
        document.getElementById("outputJson").textContent = "Please paste some Java code to process.";
        return;
    }

    if (!baseUrl.trim()) {
        document.getElementById("outputJson").textContent = "Please provide the base URL.";
        return;
    }

    try {
        // Extract method headers and class name
        const { className, methods } = extractMethodHeaders(javaCode, baseUrl);

        // Format as JSON and include the base URL with line numbers
        const formattedJson = formatMethodsAsJson(className, methods, baseUrl);

        document.getElementById("outputJson").textContent = JSON.stringify(formattedJson, null, 4);
    } catch (error) {
        document.getElementById("outputJson").textContent = `Error: ${error.message}`;
    }
}

