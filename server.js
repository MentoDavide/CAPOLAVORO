const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

const db = new sqlite3.Database('users.db');

const nunjucks = require('nunjucks');
app.set("view engine", "html");
nunjucks.configure(path.join(__dirname, 'public'), {
    autoescape: true,
    express: app
});

// Creazione della tabella utenti se non esiste
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id_user INTEGER PRIMARY KEY, username TEXT, password TEXT, birthdate INT, email TEXT)");
});

app.use(bodyParser.urlencoded({ extended: true }));

// Middleware per servire file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Pagina di accesso
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pagina di registrazione
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Registrazione utente
app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const birthdate = req.body.birthdate;
    const email = req.body.email;

    db.serialize(() => {
        // Controlla se l'username o l'email esiste già nel database
        db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], (err, row) => {
            if (err) {
                console.error(err.message);
                res.send('Errore durante la registrazione');
            } else if (row) {
                // Restituisci un messaggio di errore se l'username o l'email esiste già
                res.send('Username o email già esistenti');
            } else {
                // Inserisci l'utente nel database se l'username e l'email non esistono già
                db.run("INSERT INTO users (username, password, birthdate, email) VALUES (?, ?, ?, ?)", [username, password, birthdate, email], (err) => {
                    if (err) {
                        console.error(err.message);
                        res.send('Errore durante la registrazione');
                    } else {
                        // Dopo aver registrato l'utente, reindirizza direttamente alla pagina del profilo
                        res.redirect(`/profile?username=${username}`);
                    }
                });
            }
        });
    });
});

// Autenticazione utente
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.serialize(() => {
        db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
            if (err) {
                console.error(err.message);
                res.send('Errore durante il login');
            } else if (row) {
                // Debug: Visualizza i dettagli dell'utente trovato
                console.log("Utente trovato:", row);

                res.redirect('/profile?username=' + username); // Utilizza l'username per il reindirizzamento
            } else {
                res.send('Credenziali non valide');
            }
        });
    });
});

// Pagina del profilo
app.get('/profile', (req, res) => {
    const username = req.query.username;

    db.serialize(() => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) {
                console.error(err.message);
                res.send('Errore durante il recupero del profilo');
            } else if (row) {
                //res.send(`<h1>Benvenuto, ${username}</h1><p>Credenziali: ${row.username}, ${row.password}</p>`);
                res.render(
                    'profile.html', 
                    { 
                        user : row,
                    }
                );
            } else {
                res.send('Utente non trovato');
            }
        });
    });
});

// Route per il logout
app.post('/logout', (req, res) => {
    res.redirect('/'); // Reindirizza alla pagina di login
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
