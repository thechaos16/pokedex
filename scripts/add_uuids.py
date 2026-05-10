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
        
    # Map to store uuid by (id, name)
    uuid_map = {}
    
    for p in pokemons:
        key = (p['id'], p['name'])
        if key not in uuid_map:
            uuid_map[key] = str(uuid.uuid4())
        p['uuid'] = uuid_map[key]
        
    for e in embeddings:
        key = (e['pokemonId'], e['name'])
        if key in uuid_map:
            e['uuid'] = uuid_map[key]
        else:
            # If there's an embedding without a matching pokemon, give it a new uuid
            new_uid = str(uuid.uuid4())
            uuid_map[key] = new_uid
            e['uuid'] = new_uid
            
    with open(pokemon_file, 'w', encoding='utf-8') as f:
        json.dump(pokemons, f, ensure_ascii=False, indent=2)
        
    with open(embeddings_file, 'w', encoding='utf-8') as f:
        json.dump(embeddings, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully added UUIDs to {len(pokemons)} pokemons and {len(embeddings)} embeddings.")

if __name__ == '__main__':
    main()
