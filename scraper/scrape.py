import requests
from bs4 import BeautifulSoup
import json
import time
import re

def scrape_pokemon(url_index):
    url = f"https://pokemonkorea.co.kr/pokedex/view/{url_index}"
    resp = requests.get(url)
    if resp.status_code != 200:
        return None
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # Check if page is valid
    h3 = soup.select_one('.bx-txt h3') or soup.select_one('h3')
    if not h3:
        return None
        
    # Extract pokedex number
    num_p = h3.select_one('p.font-lato')
    if not num_p:
        return None
        
    num_match = re.search(r'No\.\s*(\d+)', num_p.text)
    if not num_match:
        return None
        
    pokedex_id = int(num_match.group(1))
    
    # If we reached beyond generation 1, return a special signal
    if pokedex_id > 151:
        return "DONE"
        
    # Extract name (excluding the p tags)
    name = ''.join(h3.find_all(text=True, recursive=False)).strip()
    
    # Extract subtitle
    subtitle = ""
    sub_p = h3.select_one('p[style="padding-top:5px;"]')
    if sub_p and sub_p.text.strip():
        subtitle = sub_p.text.strip()
        
    img_tag = soup.select_one('.bx-content img')
    img_url = img_tag['src'] if img_tag else ""
    if img_url.startswith('/'):
        img_url = 'https://pokemonkorea.co.kr' + img_url
        
    types = []
    type_spans = soup.select('.img-type p')
    for t in type_spans:
        types.append(t.text.strip())
        
    desc_tag = soup.select_one('.bx-txt p.para.descript')
    desc = desc_tag.text.strip() if desc_tag else ""
    
    height = ""
    weight = ""
    category = ""
    
    h4s = soup.select('h4')
    for h4 in h4s:
        text = h4.text.strip()
        parent_col = h4.parent
        val = parent_col.select_one('p')
        if val:
            if text == '키':
                height = val.text.strip()
            elif text == '몸무게':
                weight = val.text.strip()
            elif text == '분류':
                category = val.text.strip()
                
    return {
        "id": pokedex_id,
        "name": name,
        "subtitle": subtitle,
        "image": img_url,
        "types": types,
        "description": desc,
        "height": height,
        "weight": weight,
        "category": category
    }

def main():
    pokemon_data = []
    url_index = 1
    
    while True:
        try:
            print(f"Scraping URL index {url_index}...")
            data = scrape_pokemon(url_index)
            
            if data == "DONE":
                print("Reached end of Generation 1.")
                break
            elif data is not None:
                pokemon_data.append(data)
                
            url_index += 1
            time.sleep(0.1) # be nice
            
        except Exception as e:
            print(f"Error scraping {url_index}: {e}")
            url_index += 1
            
    with open('../src/data/pokemon.json', 'w', encoding='utf-8') as f:
        json.dump(pokemon_data, f, ensure_ascii=False, indent=2)
    print(f"Done! Saved {len(pokemon_data)} pokemons to pokemon.json")

if __name__ == "__main__":
    main()
