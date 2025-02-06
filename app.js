// Creacion de una API REST -> Arquitectura de Software
// Importar
const express = require('express') // -> require : commondJS
const crypto = require('node:crypto')
const cors = require('cors')

// Variables
const app = express() // framework -> npm i express -E
// Usar el moddleware
app.use(express.json())

// Utilizar los cors
app.use(cors({
    origin: (origin, callback) => {
        // Origins accept to access
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:1234',
            'http://movies.com',
            'http://midu.dev'
        ]

        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by cors'))
    }
})) //middleware de cors -> npm i cors -E

const PORT = process.env.PORT ?? 1234
const movies = require('./movies.json')

// Exportar esquema de validacion -> npm i zod -E
const { validateMovie, validatePartialMovie } = require('./schemas/movie')


app.disable('x-powered-by')
// Metodos normales: GET/HEAD/POST
// Metodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS > Genera una peticion previa 

app.get('/', (req, res) => {
    res.json({ mesasge: 'Bienvenidos!' })
})

// Recuperar todos los recursos (peliculas)
app.get('/movies', (req, res) => {
    // // Obtener el origin desde donde se cosnume la api
    // const origin = req.header('origin') // <- No envia la cabecera del origin si proviene del propio origin
    // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    //     //Generar en este endpoint el acceso
    //     res.header('Access-Control-Allow-Origin', origin)

    // }

    //Query params
    const { genre } = req.query
    if (genre) {
        const filterMovies = movies.filter(
            movie => movie.genre.some(
                g => g.toLowerCase() == genre.toLocaleLowerCase()
            )
        )
        return res.json(filterMovies)
    }

    res.json(movies)
})

// Recuperar una pelicula de todos los recursos (peliculas) ->endpoint
app.get('/movies/:id', (req, res) => { // path-to-regexp
    const { id } = req.params

    // Forma correcta de obtener en un JSON
    const movie = movies.find(movie => movie.id == id)
    // Validar existencia
    if (movie) return res.json(movie)

    // sino se encuentra
    res.status(404).json({ message: 'Movie not found' })

})

// Crear una pelicula
app.post('/movies', (req, res) => {

    // Requiere el middleware de express
    // Validar el req.body
    const result = validateMovie(req.body)

    // Validaciones utilizando zod
    if (!result.success) {
        // Also status code 422 -> Unprocessable entity
        return res.status(400).json({
            error: JSON.parse(result.error.message)
        })
    }


    // Crear la nueva movie
    const newMovie = {
        id: crypto.randomUUID(), // Identificador unico universal ->uuid v4
        // Agrega la data requerida NO todo el body
        ...result.data // ❌body
    }

    // Esto no es rest api por guardar el estado de la aplicacion en la memoria
    movies.push(newMovie)

    // Devolver una accion por la creacion de la pelicula
    res.status(201).json(newMovie)
})

// Actualizar una pelicula
// Modificar solo una parte de la pelicula

app.patch('/movies/:id', (req, res) => {
    const { id } = req.params

    // Validacion parcial del esquema
    const result = validatePartialMovie(req.body)

    if (result.error) {
        return res.status(400).json({
            error: JSON.parse(result.error.message)
        })
    }

    // Buscamos la movie
    const movieIndex = movies.findIndex(movie => movie.id == id)

    if (movieIndex === -1) {
        return res.status.apply(404).json({ mesasge: 'Movie not found' })
    }

    // Creamos la movie nueva(actual-modificada)
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie
    return res.json(updateMovie)
})

// Eliminar una película
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }

    movies.splice(movieIndex, 1)

    return res.json({ message: 'Movie deleted' })
})

// app.options('/movies/:id', (req, res) => {
//     // Obtener el origin desde donde se cosnume la api
//     const origin = req.header('origin') // <- No envia la cabecera del origin si proviene del propio origin
//     if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//         // Generar en este endpoint el acceso
//         res.header('Access-Control-Allow-Origin', origin)
//         // Cabecera para indicar que metodos estan permitidos
//         res.header('Access-Control-Allow-Methods:', 'GET, POST, PATCH, DELETE')

//     }
//     res.send(200)
// })

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})