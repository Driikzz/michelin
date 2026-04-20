import express from "express";
import { Pool } from "pg";
const app = express();
const port = 5000;
// Connexion à PostgreSQL via la variable d'environnement DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
// Middleware pour parser le JSON
app.use(express.json());
// Exemple de route test pour vérifier la connexion à la base
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ time: result.rows[0].now });
    }
    catch (err) {
        res.status(500).json({ error: "Erreur de connexion à la base", details: err });
    }
});
// Démarrage du serveur Express
app.listen(port, () => {
    console.log(`Serveur Express lancé sur http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map