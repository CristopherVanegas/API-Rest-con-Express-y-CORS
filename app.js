const express = require('express')
const pc = require('picocolors')
const movies = require('./movies.json')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./schemas/movieSchema')
// const { movieSchema } = require('./schemas/movieSchema')
const app = express()

app.use(express.json())
app.disable('x-powered-by')

// lista de origenes con acceso
const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'https://cristophercodes.netlify.app',
  '*'
]

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    console.log(pc.yellow('requested get movies, origin:'), pc.cyan(origin))
  }

  // res.header('Access-Control-Allow-Origin', '*') - esto no se hace - vulnerabilidad

  const { genre } = req.query
  if (genre) {
    const filterMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filterMovies)
  }
  res.json(movies)
})

// segmento dinamico por id || path-tp-regexp
app.get('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    console.log(pc.yellow('requested get movies, origin:'), pc.cyan(origin))
  }

  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)

  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422 error de entidad
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // como utilizamos zod, validamos y ya no guardamos en memoria, ahora si seguimos los principios REST
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data // solo si hemos hecho bien la validación.
  }

  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  // valida que el cuerpo de la solicitud y el esquema sean iguales
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'No movie found to update!' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    console.log(pc.yellow('requested get movies, origin:'), pc.cyan(origin))
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ messsage: 'movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    // console.log(pc.yellow('requested get movies by id, origin:'), pc.cyan(origin))
  }

  res.send(200)
})

app.use((req, res) => {
  return res.status(404).json({ error: 'The url you request does not exist. ' })
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
