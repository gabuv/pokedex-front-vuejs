<template>
  <div v-if="dataNotInitialized" class="center-block">
    <div v-if="!loading" class="update-block">
      <h1>
        {{ updateMessage }}
      </h1>
      <button @click="launch_init_pokedex()" class="update-button">Initialiser le Pokedex ?</button>
    </div>
    <div v-else class="update-block">
      <h1>
        L'initialisation du Pokedex est en cours. Les types de Pokemon et les 3 starters vont être
        ajoutés.
      </h1>
      <VueSpinner size="50" color="rgb(97, 62, 252)" />
    </div>
  </div>
  <div v-else style="display: flex">
    <div v-show="countReactive.count > 0" class="sidebar">
      <p style="margin-top: 1rem">Total Pokedex : {{ countReactive.count }}</p>
      <input
        id="search-bar"
        v-model="searchTerm"
        placeholder="Chercher un Pokemon"
        v-on:keyup.enter="searchPokemon()"
        autocomplete="off"
      />

      <div
        class="item pokemon-name"
        v-for="pokemonName in filteredList()"
        :key="pokemonName"
        @click="searchPokemon(pokemonName)"
      >
        <p>{{ pokemonName }}</p>
      </div>
      <div class="item error" v-if="searchTerm.length > 0 && !filteredList().length">
        <p>
          Ce Pokemon est encore inconnu. Lancer une recherche avec 'Entrée' pour savoir s'il existe!
        </p>
      </div>
    </div>
    <div v-if="!loading" style="margin-top: 1rem">
      <div v-if="errorMessage" style="margin: 1rem">
        <h1>{{ errorMessage }}</h1>
      </div>
      <div v-else-if="loadedPokemon">
        <h1>{{ successMessage }}</h1>
        <div>
          <h1 style="margin: 1rem 0">{{ capitalize(loadedPokemon.name) }}</h1>
          <div style="display: flex">
            <div
              v-for="item in loadedPokemon.types"
              :key="item.image_src"
              style="margin-right: 1rem"
            >
              <img :src="item.image_src" height="30" />
            </div>
          </div>
        </div>
        <img :src="loadedPokemon.image_src" height="300" />
        <h2>Taille : {{ loadedPokemon.height }}</h2>
        <h2>Poids : {{ loadedPokemon.weight }}</h2>
      </div>
      <div v-else-if="lastDiscoveredPokemon">
        <h1>Dernier Pokemon rencontré : {{ capitalize(lastDiscoveredPokemon.name) }}</h1>
        <img :src="lastDiscoveredPokemon.image_src" />
      </div>
    </div>
    <div v-else style="margin: 15rem">
      <VueSpinner size="50" color="rgb(97, 62, 252)" />
    </div>
  </div>
</template>

<script setup>
import apiService from '../service/apiService'
import { ref, onMounted, reactive } from 'vue'
import { VueSpinner } from 'vue3-spinners'

let lastDiscoveredPokemon = ref('')
let loadedPokemon = ref('')
let searchTerm = ref('')
let pokemonNames = []
let successMessage
let errorMessage = ref('')
let loading = ref(false)
let countReactive = reactive({ count: 0 })
let dataNotInitialized = ref(false)
let updateMessage = ref(
  "Le Pokedex n'a pas encore été initialisé. Cliquer sur le bouton suivant pour lancer la mise à jour!"
)

onMounted(() => {
  getIndex()
  getPokemonNamesList()
})

function getIndex() {
  apiService.getIndex().then((response) => {
    if (response.status == 204) {
      dataNotInitialized.value = true
    } else {
      lastDiscoveredPokemon.value = response.data
      dataNotInitialized.value = false
    }
  })
}

function getPokemonNamesList() {
  apiService.getPokemonNames().then((response) => {
    const namesCapitalized = response.data.map((str) => capitalize(str))
    pokemonNames.value = namesCapitalized
    countReactive.count = pokemonNames.value.length
    searchTerm.value = ''
  })
}

async function searchPokemon(knownPokemon) {
  let name = searchTerm.value
  searchTerm.value = ''
  errorMessage.value = ''
  if (knownPokemon) {
    name = knownPokemon
  }
  await callBackendSearchNewPokemon(name)
    .then(() => {
      // si le Pokemon correspondant est déjà dans le Pokedex
      if (pokemonNames.value.findIndex((n) => n.toLowerCase() === name.toLowerCase()) > -1) {
        successMessage = ''
      } else {
        successMessage = 'Félicitations vous avez trouvé un nouveau Pokemon !'
        countReactive.count++
        pokemonNames.value.push(loadedPokemon.value.name)
      }
    })
    .catch(() => {
      errorMessage.value = "Le pokemon n'a pas été trouvé."
    })
}

async function callBackendSearchNewPokemon(term) {
  loading.value = true
  await apiService.getPokemon(term).then((response) => {
    loading.value = false
    if (response.status == 200) {
      loadedPokemon.value = response.data
      return pokemonNames.value
    } else {
      throw new Error('Pokemon non trouvé!')
    }
  })
}

function filteredList() {
  let filtered = []
  if (pokemonNames.value)
    filtered = pokemonNames.value
      ?.filter((name) => name.toLowerCase().includes(searchTerm.value.toLowerCase()))
      .slice(0, 10)
  return filtered
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function launch_init_pokedex() {
  loading.value = true
  await apiService.updatePokedex().then((response) => {
    loading.value = false
    if (response.status == 200) {
      dataNotInitialized.value = false
      location.reload()
    } else {
      updateMessage.value = 'La mise à jour a échoué, veuillez réessayer.'
    }
  })
}
</script>

<style>
.sidebar {
  height: 100vh;
  padding: 0 2rem;
}

input {
  display: block;
  width: 350px;
  margin: 20px auto;
  padding: 10px 45px;
  background: white url('assets/search-icon.svg') no-repeat 15px center;
  background-size: 15px 15px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  box-shadow:
    rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
}

.item {
  width: 350px;
  margin: 0 auto 10px auto;
  padding: 10px 20px;
  color: white;
  border-radius: 5px;
  box-shadow:
    rgba(0, 0, 0, 0.1) 0px 1px 3px 0px,
    rgba(0, 0, 0, 0.06) 0px 1px 2px 0px;
}

.pokemon-name {
  background-color: rgb(97, 62, 252);
  cursor: pointer;
  text-transform: capitalize;
}

.error {
  background-color: tomato;
}

.update-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.update-button {
  background-color: rgb(97, 62, 252);
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border: none;
  width: fit-content;
}

.center-block {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
