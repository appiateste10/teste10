// Servidor Node.js para geolocalização em tempo real
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Configurar banco de dados SQLite
const db = new sqlite3.Database(':memory:'); // Use um arquivo para persistência

// Criar tabela de localizações
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS driver_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Middleware para permitir CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Rota para obter localizações
app.get('/locations/:driverId', (req, res) => {
    const driverId = req.params.driverId;
    
    db.all(
        'SELECT latitude, longitude, timestamp FROM driver_locations WHERE driver_id = ? ORDER BY timestamp DESC LIMIT 10',
        [driverId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Configurar Socket.io para atualizações em tempo real
io.on('connection', (socket) => {
    console.log('Novo cliente conectado');
    
    // Receber atualizações de localização
    socket.on('location_update', (data) => {
        const { driverId, latitude, longitude } = data;
        
        // Salvar no banco de dados
        db.run(
            'INSERT INTO driver_locations (driver_id, latitude, longitude) VALUES (?, ?, ?)',
            [driverId, latitude, longitude],
            function(err) {
                if (err) {
                    console.error('Erro ao salvar localização:', err);
                    return;
                }
                
                // Transmitir para todos os clientes
                io.emit('location_updated', {
                    driverId,
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                });
            }
        );
    });
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});