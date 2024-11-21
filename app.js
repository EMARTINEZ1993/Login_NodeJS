const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'clave_secreta', // Cambiar por algo más seguro en producción
    resave: false,
    saveUninitialized: true
}));
app.use(express.static('views'));

// Base de datos simulada
const usuariosDB = './usuarios.json';

// Ruta principal
app.get('/', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/bienvenido');
    } else {
        res.redirect('/login.html');
    }
});

// Ruta para registro
app.post('/registro', async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.send('Por favor, completa todos los campos.');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar usuario
    const usuarios = JSON.parse(fs.readFileSync(usuariosDB, 'utf-8'));
    if (usuarios.some(u => u.usuario === usuario)) {
        return res.send('El usuario ya existe.');
    }

    usuarios.push({ usuario, password: hashedPassword });
    fs.writeFileSync(usuariosDB, JSON.stringify(usuarios));

    res.send('Registro exitoso. <a href="/login.html">Inicia sesión</a>.');
});

// Ruta para login
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;

    const usuarios = JSON.parse(fs.readFileSync(usuariosDB, 'utf-8'));
    const user = usuarios.find(u => u.usuario === usuario);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send('Usuario o contraseña incorrectos.');
    }

    req.session.usuario = usuario;
    res.redirect('/bienvenido');
});

// Ruta de bienvenida
app.get('/bienvenido', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login.html');
    }

    res.send(`<h1>Bienvenido, ${req.session.usuario}</h1><a href="/logout">Cerrar sesión</a>`);
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
