import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/pokedex',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})
export default {
  getIndex() {
    return apiClient.get('/index')
  },

  getPokemonNames() {
    return apiClient.get('/allNames')
  },

  async getPokemon(term) {
    return apiClient.get('/pokemon/' + term)
  },

  async updatePokedex() {
    return apiClient.get('/updatePokedex')
  }
}
