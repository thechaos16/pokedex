export interface Pokemon {
  id: number;
  uuid: string;
  name: string;
  subtitle?: string;
  image: string;
  types: string[];
  description: string;
  height: string;
  weight: string;
  category: string;
}
