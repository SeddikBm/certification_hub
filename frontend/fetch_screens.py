import json
import os
import urllib.request
import urllib.error

output_file = "C:/Users/dell/.gemini/antigravity-ide/brain/c0b9b89f-4a61-43c8-a93b-46a015aeb3ce/.system_generated/steps/129/output.txt"
output_dir = "C:/Users/dell/Desktop/certificationHub/frontend/.stitch/designs"
os.makedirs(output_dir, exist_ok=True)

with open(output_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

screens = data.get("screens", [])

def slugify(text):
    return "".join(c if c.isalnum() else "_" for c in text.lower()).strip("_")

metadata_screens = {}

def download(url, path):
    try:
        urllib.request.urlretrieve(url, path)
        print(f"Downloaded {path}")
    except Exception as e:
        print(f"Failed to download {url} to {path}: {e}")

for screen in screens:
    screen_id = screen["name"].split("/")[-1]
    title = screen.get("title", screen_id)
    slug = slugify(title)
    
    html_url = screen.get("htmlCode", {}).get("downloadUrl")
    screenshot_url = screen.get("screenshot", {}).get("downloadUrl")
    width = screen.get("width", "1280")
    
    if html_url:
        html_path = os.path.join(output_dir, f"{slug}.html")
        download(html_url, html_path)
        
    if screenshot_url:
        png_path = os.path.join(output_dir, f"{slug}.png")
        screenshot_url_w = f"{screenshot_url}=w{width}"
        download(screenshot_url_w, png_path)
        
print("Python download attempt finished.")
