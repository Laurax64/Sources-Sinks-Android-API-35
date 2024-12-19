import requests
from bs4 import BeautifulSoup
import json

def fetch_api_diff(api_version):
    url = f"https://developer.android.com/sdk/api_diff/{api_version}/changes"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data from API {api_version} - Status Code: {response.status_code}")
    
    soup = BeautifulSoup(response.text, 'html.parser')
    changes = []

    for change in soup.select('.jd-diff-added, .jd-diff-removed, .jd-diff-modified'):
        change_type = change.get('class')[0].replace('jd-diff-', '')
        for item in change.select('li'):
            changes.append({
                "type": change_type,
                "text": item.get_text(strip=True)
            })
    
    return changes

def save_to_json(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

# Fetch changes between API 34 and 35
try:
    api_34_changes = fetch_api_diff(34)
    api_35_changes = fetch_api_diff(35)

    combined_changes = {
        "API_34_Changes": api_34_changes,
        "API_35_Changes": api_35_changes,
    }

    save_to_json(combined_changes, "api_changes_34_to_35.json")
    print("API changes saved to api_changes_34_to_35.json")
except Exception as e:
    print(f"Error: {e}")
