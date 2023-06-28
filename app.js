const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;
const convertDbcaseToCamelcase = (db) => {
  return {
    movieName: db.movie_name,
  };
};

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started in port:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
  }
};

initializeDatabaseAndServer();

// get movies
app.get("/movies/", async (request, response) => {
  const getMovieQuery = `SELECT movie_name FROM movie;`;
  const movieArray = await db.all(getMovieQuery);
  response.send(
    movieArray.map((eachMovie) => convertDbcaseToCamelcase(eachMovie))
  );
});

// create movie object
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const insertMovieQuery = `
    INSERT INTO
        movie (director_id, movie_name, lead_actor)
    VALUES
        ('${directorId}',
        '${movieName}',
        '${leadActor}');`;
  const dbResponse = await db.run(insertMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

const convertAllMovieDetails = (db) => {
  return {
    movieId: db.movie_id,
    directorId: db.director_id,
    movieName: db.movie_name,
    leadActor: db.lead_actor,
  };
};

// get movie by id
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(convertAllMovieDetails(movie));
});

// update movie
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
  UPDATE 
  movie 
  SET 
    director_id = '${directorId}',
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
  WHERE 
    movie_id = '${movieId}';    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});
// delete movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = '${movieId}'; `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertDirToCamelcase = (db) => {
  return {
    directorId: db.director_id,
    directorName: db.director_name,
  };
};

// get director by id
app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `SELECT * FROM director;`;
  const directorArray = await db.all(getDirectorQuery);
  response.send(
    directorArray.map((eachMovie) => convertDirToCamelcase(eachMovie))
  );
});
const convertMovieNameToCamelcase = (db) => {
  return {
    movieName: db.movie_name,
  };
};
// get movie by director's id /directors/:directorId/movies/
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieByDirectorQuery = `SELECT movie_name FROM movie WHERE director_id = ${directorId};`;
  const movieArray = await db.all(getMovieByDirectorQuery);
  response.send(movieArray.map((movie) => convertMovieNameToCamelcase(movie)));
});

module.exports = app;
