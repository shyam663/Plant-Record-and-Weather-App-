/* 
* see todo.txt for todo items 
*/
const express = require("express");
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const pool = dbConnection();
const fetch = require('node-fetch');
var weatherData;
var hash;
var globalUsername;
//Randon Plant Api

// SESSIONS BOILERPLATE ///////////////////////
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'finalProjectTeam2FA22',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
///////////////////////////////////////////////

app.get('/profile', isAuthenticated, async (req, res) => {

  let sql = `SELECT *
             FROM fp_plants`;
  let rows = await executeSQL(sql);
  let randomPlantId = Math.floor(Math.random() * (rows.length - 0) + 1);
  let randomPlantSql = `SELECT *
                         FROM fp_plants
                         WHERE plantId = ?`;
  let randomPlantRows = await executeSQL(randomPlantSql, [randomPlantId]);
  console.log(randomPlantRows[0].Plantname);
  let pictureUrl = `https://pixabay.com/api/?key=5589438-47a0bca778bf23fc2e8c5bf3e&q=${randomPlantRows[0].Plantname}&orientation=vertical`;
  let pictureResponse = await fetch(pictureUrl);

  var pictureData = await pictureResponse.json();
  let userSql = `SELECT username
                 FROM fp_user
                 WHERE username = ?`;
  let userRows = await executeSQL(userSql, globalUsername);
  res.render('profile',{"pictureSrc":pictureData.hits[].webformatURL,"plantInfo":randomPlantRows[0],"username":userRows});
});

app.get('/admin', isAuthenticated, (req, res) => {
  res.render('');
});

// middleware functions
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    req.session.authenticated = true;
    // change back to...
    // res.redirect('/');
  }
}

app.set("view engine", "ejs");
app.use(express.static("public"));
//to parse Form data sent using POST method
app.use(express.urlencoded({ extended: true }));

//=
//routes
app.get('/', async (req, res) => {

  //Plant Api

  let sql = `SELECT *
             FROM fp_plants`;
  let rows = await executeSQL(sql);
  // let randomPlantId = _.random(1,rows.size());
  // add random functionality
  let randomPlantId = Math.floor(Math.random() * (rows.length - 0) + 1);
  let randomPlantSql = `SELECT *
                         FROM fp_plants
                         WHERE plantId = ?`;
  let randomPlantRows = await executeSQL(randomPlantSql, [randomPlantId]);
  console.log(randomPlantRows[0].Plantname);
  let pictureUrl = `https://pixabay.com/api/?key=5589438-47a0bca778bf23fc2e8c5bf3e&q=${randomPlantRows[0].Plantname}&orientation=vertical`;
  let pictureResponse = await fetch(pictureUrl);

  var pictureData = await pictureResponse.json();

  res.render('home',{"pictureSrc":pictureData.hits[0].webformatURL,"plantInfo":randomPlantRows[0]});
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Ref: Instead it will be displayplants
app.get('/displayplants', isAuthenticated, async (req, res) => {
  let sql = `SELECT *
             FROM fp_pants`;
  let rows = await executeSQL(sql);
  // console.log(rows);
  res.render('displayplants', { "plants": rows });
});//displayAuthors route


app.get('/historyplants', isAuthenticated, async (req, res) => {
  let sql = `SELECT *
             FROM fp_plants`;
  let rows = await executeSQL(sql);
  let weatherSql = `SELECT *
             FROM fp_weather`;
  let weatherRows = await executeSQL(weatherSql);
  // console.log(rows);
  res.render('historyplants', { "plants": rows,"weather": weatherRows});
});//displayAuthors route



// REF: instead it will be updateplants
app.get('/updateplants', isAuthenticated, async (req, res) => {
  let plantId = req.query.id;
  let sql = `SELECT *
             FROM fp_plants
             WHERE plantId = ?`;
  let params = [plantId];
  let rows = await executeSQL(sql, params);
  console.log(rows);
  res.render('updateplants', { "plantsinfo": rows });
});
//

app.post('/updateplants', isAuthenticated, async (req, res) => {
  let plantId = req.body.plantId;
  console.log(plantId);
  let Plantname = req.body.Plantname;
  let Type = req.body.Type;
  let color = req.body.color;
  let Origin = req.body.Origin;
  let Weather = req.body.Weather;
  let description = req.body.description;
  let sql = `UPDATE fp_plants
             SET
               Plantname = ?,
               Type = ?,
               color = ?,
               Weather = ?,
               Origin = ?,
               description = ?
            WHERE
              plantId = ?`;
            
  let params = [Plantname, Type, color, Weather, Origin, description, plantId];
  let rows = executeSQL(sql, params);
  // console.log(rows);
  res.redirect('/displayPlants');
  // res.render('addAuthor');
});

app.get('/deleteplants', isAuthenticated, async (req, res) => {
  let plantId = req.query.id;
  let sql = `DELETE FROM fp_plants
             WHERE plantId =?`;
  let rows = executeSQL(sql, [plantId]);
  res.redirect('/displayplants');
});




// plants need img url for later use, will be implmeneted later, check todos
app.get('/addplants', isAuthenticated, (req, res) => {
  res.render('addplants');
});//addAuthor route


app.post('/addplants', isAuthenticated, (req, res) => {
  let Plantname = req.body.Plantname;
  let Type = req.body.Type;
  let color = req.body.color;
  let Origin = req.body.Origin;
  let Weather = req.body.Weather;
  let description = req.body.description;
  //console.log(Plantname);
  
  let sql = `INSERT INTO fp_plants
             (Plantname, Type, color, Weather, Origin, description)
             VALUES
             (?,?,?,?,?,?)`;
  let params = [Plantname, Type, color, Weather, Origin, description];
  let rows = executeSQL(sql, params);
  res.redirect('/profile');
});//addAuthor route


//LogIn
app.post('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let passwordHash = "";

  let sql = `SELECT password
              FROM fp_user
              WHERE username = ?`;
  let rows = await executeSQL(sql, [username]);


  
  if (rows.length > 0) { //username found in database!
    passwordHash = rows[0].password;
  }
  const match = await bcrypt.compare(password, passwordHash);

  if (match) {
    req.session.authenticated = true;
    globalUsername = username;
    res.redirect("/profile");
  } else {
    res.render('login', { "error": "Wrong Credentials!" })
  }
});

//LogOut
app.get('/logout', (req, res) => {
  req.session.destroy();
  globalUsername = "";
  res.redirect('/');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let checkSql = `SELECT username
                  FROM fp_users`;
  let checkRows = await executeSQL(checkSql);
  // console.log(checkRows.length);
  // res.send("Debugging this....")
  for (let i = 0; i < checkRows.length; i++){
    if(checkRows[i].username == username){
      res.redirect('/login');
    }
  }
  
  hash = bcrypt.hashSync(password, 10);
  let sql = `INSERT INTO fp_user
             (username, password)
             VALUES
             (?,?)`;
  let params = [username, hash];
  let rows = await executeSQL(sql, params);
  req.session.authenticated = true;
  globalUsername = username;
  res.redirect('/profile');
  
});

app.get('/updateUser', isAuthenticated, async (req, res) => {
  let sql = `SELECT *
             FROM fp_user
             WHERE username = ?`;
  let rows = await executeSQL(sql,globalUsername);
  res.render('updateUser',{"userData":rows});
});

app.post('/updateUser', isAuthenticated, async (req, res) => {
  let userId = req.body.userId;
  let username = req.body.username;
  console.log(userId);
  let password = req.body.password;
  globalUsername = username;
  let sql = `UPDATE fp_user
             SET
               username = ?,
               password = ?
            WHERE
              fpuserId = ?`;
  let params = [username, password, userId];
  let rows = await executeSQL(sql, params);
  console.log(rows);
  res.redirect('/profile');
});



//goBack
app.get('/goBack', (req, res) => {
  res.redirect('/');
});




app.get("/dbTest", async function(req, res) {
  let sql = "SELECT CURDATE()";
  let rows = await executeSQL(sql);
  res.send(rows);
});//dbTest

//functions
async function executeSQL(sql, params) {
  return new Promise(function(resolve, reject) {
    pool.query(sql, params, function(err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}//executeSQL
//values in red must be updated
function dbConnection() {

  const pool = mysql.createPool({

    connectionLimit: 10,
    host: "x71wqc4m22j8e3ql.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "hculjw2zl354xunv",
    password: "pfmx4av8rm1g5kw8",
    database: "ccorf7c418bpan6b"

  });

  return pool;

} //dbConnection

//start server
app.listen(3000, () => {
  console.log("Express server running...");
})