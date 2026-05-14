const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto')
const { validateMovie } = require('./schemas/movieSchema')
// const { movieSchema } = require('./schemas/movieSchema')
const app = express()

app.use(express.json())
app.disable('x-powered-by')

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
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

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
