url = "https://s3.amazonaws.com/itos-humanitarian/IDN/IDNAdmin2.json"
attribute = ""

import urllib.request, json 
with urllib.request.urlopen("http://maps.googleapis.com/maps/api/geocode/json?address=google") as url:
    data = json.loads(url.read().decode())
    print(data)