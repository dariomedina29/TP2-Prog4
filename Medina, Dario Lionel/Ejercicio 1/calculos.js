import express from "express";
import { db } from "./db.js";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

const validarRectangulo = [
  body("lado1", "lado1 inválido").isFloat({ gt: 0 }),
  body("lado2", "lado2 inválido").isFloat({ gt: 0 }),
];

const validarId = [
  param("id").isInt({ min: 1 }),
];

const verificarValidaciones = (req, res, next) => {
    const validacion = validationResult(req);
    if(!validacion.isEmpty()){
        return res
        .status(400)
        .json({sucess: false, message: "Falla de validacion", errores: validacion.array(),})
    }
    next();
};

router.post("/resultado", validarRectangulo, verificarValidaciones, async(req,res)=> {
    const {lado1, lado2} = req.body;
    const Lado1 = parseInt(lado1);
    const Lado2 = parseInt(lado2);

    const perimetro = 2 * (Lado1 + Lado2);
    const superficie = Lado1 * Lado2;

    const [result] = await db.execute("INSERT INTO rectangulos (lado1, lado2, perimetro, superficie) VALUES (?, ?, ?, ?)",
    [Lado1, Lado2, perimetro, superficie]
);

    return res.json({
        id: result.insertId,
        lado1: Lado1,
        lado2: Lado2,
        perimetro,
        superficie,
    });

});

router.get("/calculo", async (req,res)=>{
    const [rows] = await db.execute("SELECT id, lado1, lado2, perimetro, superficie FROM rectangulos");
    
    return res.json(rows);
});

router.put("/resultado/:id", [...validarId, ...validarRectangulo], verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const {lado1, lado2} = req.body;
    const n1 = parseInt(lado1);
    const n2 = parseInt(lado2);

    const [exists] = await db.execute("SELECT id FROM rectangulos WHERE id=?", [id]);
    if (exists.length === 0){
        return res
        .status(404)
        .json({sucess: false, message: "Rectangulo no encontrado"});
    }

    const perimetro = 2 * (n1+n2);
    const superficie = n1 * n2;

    await db.execute("UPDATE rectangulos SET lado1=?, lado2=?, perimetro=?, superficie=? WHERE id=?",
        [n1, n2, perimetro, superficie, id]
    );

    return res.json({id, lado1: n1, lado2: n2, perimetro, superficie});
});

router.get("/calculo", async (req,res) => {
    const [rows] = await db.execute("SELECT id, lado1, lado2, perimetro, superficie FROM rectangulos");
    return res.json(rows);
});

export default router;