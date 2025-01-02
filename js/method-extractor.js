
const keywords = [
    "abstract", "continue", "for", "new", "switch",
    "assert", "default", "if", "package", "synchronized",
    "boolean", "do", "goto", "private", "this",
    "break", "double", "implements", "protected", "throw",
    "byte", "else", "import", "public", "throws",
    "case", "enum", "instanceof", "return", "transient",
    "catch", "extends", "int", "short", "try",
    "char", "final", "interface", "static", "void",
    "class", "finally", "long", "strictfp", "volatile",
    "const", "float", "native", "super", "while",
    "_"
];

const separators = ["(", ")", "{", "}", "[", "]", ";", ",", ".", "...", "@", "::"]

const primitiveTypes = ["byte", "short", "int", "long", "float", "double", "char", "boolean"];

/** 
 * Extracts data transmitted from the parameters of a method.
 * 
 * @param {string} parameters - The parameters of a method.
 * @returns {Array} - An array of objects representing the data transmitted.
 */
function getDataTransmitted(parameters) {
    const parameterTypes = parameters.split(",").map(param => param.trim().split(" ")[0]);
    const dataTransmitted = [];
    parameterTypes.forEach(type => {
        dataTransmitted.push({
            type: type,
            description: `A ${type} into the application code`,
            possibly_sensitive: false,
            destinations: [{
                resource: "Application code",
                accessible_to_third_parties: false
            }]
        })
    })
    return dataTransmitted;
}

function getDataReturned(returnType) {
    const dataReturned = [];
    if (returnType && returnType !== "void") {
        dataReturned.push({
            "type": returnType,
            "description": `An object of type ${returnType} that might contain sensitive data, but is not sensitive itself`,
            "possibly_sensitive": false
        });
    }
    return dataReturned;
}


function extractFullyQualifiedName(className, imports) {
    if (!className) {
        return "";
    }

    if (primitiveTypes.includes(className)) {
        return className;
    }

    const name = className.replace("String", "java.lang.String")
        .replace("void", "")
        .replace("Object", "java.lang.Object")
        .replace("OutputStream", "java.io.OutputStream");

    if (name.startsWith("List")) {
        return `java.util.${name}`;
    }

    const explicitImport = imports.find((imp) => imp.endsWith(`.${className}`));
    if (explicitImport) {
        return explicitImport;
    }

    return name;
}



function extractMethodHeaders(javaCode, baseUrl) {
    const packageName = getPackageName(javaCode);
    const imports = getImports(javaCode);
    const cleanedCode = removeDocumentation(javaCode);
    const methodHeaders = getMethodHeaders(cleanedCode);

    const methods = [];
    for (const match of methodHeaders) {
        const { returnType, methodName, parameters } = match.groups;
        const fullyQualifiedReturnType = extractFullyQualifiedName(returnType.trim(), imports, packageName);
        methods.push({
            methodSignature: `${returnType.trim()} ${methodName.trim()}(${parameters.trim()})`,
            fullyQualifiedReturnType: fullyQualifiedReturnType,
            lineLink: getMethodLink(baseUrl, javaCode, match.index),
            dataReturned: getDataReturned(fullyQualifiedReturnType),
            dataTransmitted: getDataTransmitted(parameters.trim())
        });
    }

    return methods;
}


function getPackageName(javaCode) {
    const packageMatch = javaCode.match(/package\s+([\w.]+);/);
    return packageMatch ? packageMatch[1] : null;
}

function getImports(javaCode) {
    const importMatches = [...javaCode.matchAll(/import\s+([\w.*]+);/g)];
    return importMatches.map((match) => match[1]);
}

function removeDocumentation(javaCode) {
    return javaCode.replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
}

function getClassName(javaCode) {
    const cleanedCode = removeDocumentation(javaCode);
    const classMatch = cleanedCode.match(/\bclass\s+(\w+)/);
    return classMatch ? classMatch[1] : "UnknownClass";
}

function getMethodHeaders(cleanedCode) {
    const methodPattern = /(?<modifiers>\b(public|private|protected|static|final|synchronized|native|\s)+\b)\s*(?<returnType>[\w<>\[\]]+)\s+(?<methodName>[\w<>]+)\s*\((?<parameters>[^)]*)\)\s*(?<exceptions>(throws\s+[\w<>\[\],\s]+)?)\s*{/g;
    return [...cleanedCode.matchAll(methodPattern)];

}

function getMethodLink(baseUrl, javaCode, matchIndex) {
    const lineNumber = calculateLineNumber(javaCode, matchIndex);
    return `${baseUrl};l=${lineNumber}`;
}

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

function formatAsJson(className, methodHeaders, packageName, imports) {
    return {
        name: className,
        implemented_methods: methodHeaders.map(method => ({
            code: method.methodSignature,
            code_long: getCodeLong(method.methodSignature, imports, packageName),
            class: "Non-Sensitive",
            category: "",
            change_type: "Addition",
            data_returned: method.dataReturned,
            data_transmitted: method.dataTransmitted
        }))
    };
}

function getCodeLong(methodSignature, imports, packageName) {
    const fullyQualifiedReturnType = getFullyQualifiedReturnType(methodSignature, imports, packageName)
    const fullyQualifiedParameters = getFullyQualifiedParameters(methodSignature, imports, packageName)
    const methodName = getMethodName(methodSignature)
    return fullyQualifiedReturnType + " " + methodName + fullyQualifiedParameters

}

/**
 * Extracts the fully qualified return type of a method.
 * 
 * @param {String} methodSignature 
 * @param {String} imports 
 * @param {String} packageName 
 * @returns The fully qualified return type of the method.
 */
function getFullyQualifiedReturnType(methodSignature, imports, packageName) {
    if (isMethodConstructor(methodSignature)) {
        return "";
    }

    return extractFullyQualifiedName(getReturnType(methodSignature), imports, packageName);

}

function getReturnType(methodSignature) {
    return methodSignature
        .split(" ") // Split the method signature into words
        .filter(word =>
            !word.startsWith("@") && // Exclude annotations
            !keywords.includes(word) && // Exclude keywords
            !separators.some(separator => word.includes(separator)) // Exclude words with separators
        )[0]; // Get the first word that remains
}

function isMethodConstructor(methodSignature) {
    return getMethodName(methodSignature) === getClassName(methodSignature);
}

function getMethodName(methodSignature) {
    const returnType = getReturnType(methodSignature)
    console.log("returnType: " + returnType)
    const parameters = methodSignature.match(/\(([^)]*)\)/)[0]  // e.g. "(String param1, List<String> param2)"
    console.log("parameters: " + parameters)
    const name = methodSignature.replace(returnType, "").replace(parameters, "").split(" ").filter(word => !keywords.includes(word))[0]

    console.log("name: " + name)
    return name;
}

function getFullyQualifiedParameters(methodSignature, imports, packageName) {
    const parameters = methodSignature.match(/\(([^)]*)\)/)[0].split(" ") // e.g. "(String param1, List<String> param2)"
    const fullyQualifiedParameters = parameters.map(
        param => extractFullyQualifiedName(param, imports, packageName)
    ).join(", ");
    return fullyQualifiedParameters;
}


function processJavaCode() {
    const javaCode = document.getElementById("javaCode").value;
    const baseUrl = document.getElementById("baseUrl").value;
    if (!javaCode.trim()) {
        document.getElementById("outputJson").textContent = "Please paste some Java code to process.";
        return;
    }
    if (!baseUrl.trim()) {
        document.getElementById("outputJson").textContent = "Please provide the base URL.";
        return;
    }
    try {
        const packageName = getPackageName(javaCode);
        const className = getClassName(javaCode);
        const methodHeaders = extractMethodHeaders(javaCode, baseUrl);
        const imports = getImports(javaCode);
        const formattedJson = formatAsJson(className, methodHeaders, packageName, imports);

        document.getElementById("outputJson").textContent = JSON.stringify(formattedJson, null, 4);
    } catch (error) {
        document.getElementById("outputJson").textContent = `Error: ${error.message}\n${error.stack}`;
    }
}

