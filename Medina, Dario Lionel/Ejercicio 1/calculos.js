import express from "express";
import { db } from "./db.js";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

const validarRectangulo = [
  body("base", "base inválido").isFloat({ gt: 0 }),
  body("altura", "altura inválido").isFloat({ gt: 0 }),
];

const validarId = [
  param("id").isInt({ min: 1 }),
];

const verificarValidaciones = (req, res, next) => {
    const validacion = validationResult(req);
    if(!validacion.isEmpty()){
        return res
        .status(400)
        .json({success: false, message: "Falla de validacion", errores: validacion.array(),})
    }
    next();
};

router.post("/resultado", validarRectangulo, verificarValidaciones, async(req,res)=> {
    const {base, altura} = req.body;
    const perimetro = 2 * (base + altura);
    const superficie = base * altura;

    const [result] = await db.execute("INSERT INTO rectangulos (base, altura, perimetro, superficie) VALUES (?, ?, ?, ?)",
    [base, altura, perimetro, superficie]
);

    return res.json({
        id: result.insertId,
        base,
        altura,
        perimetro,
        superficie,
    });

});

router.put("/resultado/:id", [...validarId, ...validarRectangulo], verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const {base, altura} = req.body;
    const n1 = parseInt(base);
    const n2 = parseInt(altura);

    const [exists] = await db.execute("SELECT id FROM rectangulos WHERE id=?", [id]);
    if (exists.length === 0){
        return res
        .status(404)
        .json({success: false, message: "Rectangulo no encontrado"});
    }

    const perimetro = 2 * (n1+n2);
    const superficie = n1 * n2;

    await db.execute("UPDATE rectangulos SET base=?, altura=?, perimetro=?, superficie=? WHERE id=?",
        [n1, n2, perimetro, superficie, id]
    );

    return res.json({id, base: n1, altura: n2, perimetro, superficie});
});

router.delete("/resultado/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const [exists] = await db.execute("SELECT id FROM rectangulos WHERE id=?", [id]);
    if (exists.length === 0){
        return res
        .status(404)
        .json({success: false, message: "Rectangulo no encontrado"});
    }

    await db.execute("DELETE FROM rectangulos WHERE id=?", [id]);

    return res.json({success: true, message: "Rectangulo eliminado"});
})

router.get("/calculo", async (req,res) => {
    const [rows] = await db.execute("SELECT id, base, altura, perimetro, superficie FROM rectangulos");
    return res.json(rows);
});

export default router;