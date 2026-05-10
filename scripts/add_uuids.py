import json
import uuid
import os

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, 'src', 'data')
    
    pokemon_file = os.path.join(data_dir, 'pokemon.json')
    embeddings_file = os.path.join(data_dir, 'pokemon_embeddings.json')
    
    with open(pokemon_file, 'r', encoding='utf-8') as f:
        pokemons = json.load(f)
        
    with open(embeddings_file, 'r', encoding='utf-8') as f:
        embeddings = json.load(f)
        
    for p in pokemons:
        p['uuid'] = str(uuid.uuid4())
        
    for e in embeddings:
        e['uuid'] = str(uuid.uuid4())
            
    with open(pokemon_file, 'w', encoding='utf-8') as f:
        json.dump(pokemons, f, ensure_ascii=False, indent=2)
        
    with open(embeddings_file, 'w', encoding='utf-8') as f:
        json.dump(embeddings, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully added completely unique UUIDs to {len(pokemons)} pokemons and {len(embeddings)} embeddings.")

if __name__ == '__main__':
    main()
