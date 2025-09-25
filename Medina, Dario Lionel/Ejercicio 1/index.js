import express from "express"
import { conectarDB } from "./db.js"
import calculosRouter from "./calculos.js"

conectarDB ();

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req,res) => {
    res.send("Hola Mundo!")
});

app.use("/", calculosRouter);

app.listen(port, () => {
    console.log(`La aplicación esta funcionando en ${port}`);
})