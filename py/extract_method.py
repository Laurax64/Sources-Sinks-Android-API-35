import re
import requests
import json

def download_java_file(url):
    """Downloads the content of a Java file from a given URL."""
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Failed to fetch Java file from {url}. HTTP Status: {response.status_code}")

def extract_method_headers(java_code):
    """Extracts method headers from the Java code."""
    method_pattern = re.compile(r'(?P<modifiers>\b(public|private|protected|static|final|synchronized|abstract|native|\s)+\b)\s*(?P<return_type>[\w<>\[\]]+)\s+(?P<method_name>[\w<>]+)\s*\((?P<parameters>[^)]*)\)')
    matches = method_pattern.finditer(java_code)

    methods = []
    for match in matches:
        modifiers = match.group("modifiers").strip()
        return_type = match.group("return_type").strip()
        method_name = match.group("method_name").strip()
        parameters = match.group("parameters").strip()
        method_signature = f"{return_type} {method_name}({parameters})".strip()
        methods.append(method_signature)

    return methods

def format_methods_as_json(methods, url):
    """Formats the extracted methods into the specified JSON format."""
    formatted_methods = []
    for method in methods:
        short_code = method.split('(')[0].strip()
        full_code = method.strip()

        formatted_methods.append({
            "code": short_code,
            "code_long": full_code,
            "link": url,
            "class": "Non-Sensitive",
            "category": "",
            "change_type": "Addition",
            "data_returned": [],
            "data_transmitted": []
        })
    return formatted_methods

def main():
    java_file_url = input("Enter the URL of the Java file: ")
    try:
        java_code = download_java_file(java_file_url)
        method_headers = extract_method_headers(java_code)
        formatted_methods = format_methods_as_json(method_headers, java_file_url)

        output_file = "method_headers.json"
        with open(output_file, "w") as f:
            json.dump(formatted_methods, f, indent=4)

        print(f"Method headers successfully extracted and saved to {output_file}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
