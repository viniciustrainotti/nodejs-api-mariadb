const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const bcrypt = require('bcrypt');

router.post('/cadastro', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if(error){ return res.status(500).send({ error: error}) }
        conn.query('SELECT * FROM usuarios WHERE email = ?', [req.body.email], (error, results) => {
            if(error){ return res.status(500).send({ error: error }) }
            if(results.length > 0){
                res.status(409).send({
                    mensagem: 'Usuário já cadastrado'
                });
            }else{
                bcrypt.hash(req.body.senha, 10, (ErrBcrypt, hash) => {
                    if(ErrBcrypt){
                        return res.status(500).send({ error: ErrBcrypt });
                    }
                    conn.query(
                        'INSERT INTO usuarios (email, senha) VALUE (?, ?)',
                        [req.body.email, hash],
                        (error, results) => {
                            conn.release();
                            if(error){ return res.status(500).send({ error: error }) }
                            response = {
                                mensagem: 'Usuário criado com sucesso',
                                usuarioCriado: {
                                    id_usuario: results.insertId,
                                    email: req.body.email
                                }
                            }
                            return res.status(201).send(response);
                        }
                    )
                }); //bcrypt.hash(conteudo, ~salt) ~utilizado para add caracteres a mais
            }
        })
    });
});

module.exports = router;