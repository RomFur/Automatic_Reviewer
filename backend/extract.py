import requests
import json

API_KEY = "4341ecef87c8aa49aa7e18e770d75934118e2848"

search_url = "https://api.clarivate.com/apis/wos-starter/v1/documents"

headers = {
    "X-APIKey": API_KEY,
    "Accept": "application/json"
}

params = {
    "q": 'TS="sport technology"',
    "limit": 1
}

response = requests.get(search_url, headers=headers, params=params)

if response.status_code == 200:
    data = response.json()
    if data['hits']:
        record = data['hits'][0]

        uid = record.get('uid', 'N/A')
        title = record.get('title', 'N/A')

        authors_list = record.get('names', {}).get('authors', [])
        authors_str = ", ".join([author.get('displayName', 'N/A') for author in authors_list]) if authors_list else "N/A"

        source = record.get('source', {})
        year = source.get('publishYear', 'N/A')
        journal = source.get('sourceTitle', 'N/A')
        volume = source.get('volume', 'N/A')
        issue = source.get('issue', 'N/A')
        pages = source.get('pages', {}).get('range', 'N/A')

        doi = record.get('identifiers', {}).get('doi', 'N/A')

        full_record_url = record.get('links', {}).get('record')

        abstract = "N/A"
        if full_record_url:
            full_response = requests.get(full_record_url, headers=headers)
            print(f"Full record status: {full_response.status_code}")
            print(full_response.text[:500])  

            if full_response.status_code == 200:
                try:
                    full_data = full_response.json()
                    abstract = full_data.get('abstract', 'N/A')
                except Exception as e:
                    print("Error parsing full record JSON:", e)

        print(f"UID: {uid}")
        print(f"Title: {title}")
        print(f"Authors: {authors_str}")
        print(f"Year: {year}")
        print(f"Journal: {journal}")
        print(f"Volume: {volume}")
        print(f"Issue: {issue}")
        print(f"Pages: {pages}")
        print(f"DOI: {doi}")
        print(f"Abstract: {abstract[:200]}..." if abstract != 'N/A' else "Abstract: N/A")

    else:
        print("No records found.")
else:
    print(f"Error {response.status_code}: {response.text}")
