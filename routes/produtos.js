const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const multer = require('multer');
//const upload = multer({ dest: 'uploads/'});
const login = require('../middleware/login');

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    }else{
        cb(null, false);
    }
    // cb(null, true);
    // cb(null, false);
}

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 //5Mb
    },
    fileFilter: fileFilter
 });

// RETORNA TODOS OS PRODUTOS
router.get('/', (req, res, next) => {

    mysql.getConnection((error, conn) => {
        if(error){ return res.status(500).send({ error: error }) }
        conn.query(
            'SELECT * FROM produtos;',
            (error, result, fields) => {
                if(error){ return res.status(500).send({ error: error }) }
                const response = {
                    quantidade: result.length,
                    produtos: result.map(prod => {
                        return{
                            id_produtos: prod.id_produtos,
                            nome: prod.nome,
                            preco: prod.preco,
                            imagem_produto: prod.imagem_produto,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna o detalhe de um produto em especifico',
                                url: 'http://localhost:1000/produtos/' + prod.id_produtos
                            }
                            
                        }
                    })
                }
                return res.status(200).send({response: response});
            }
        )
    });
    
});

// RETORNA OS DADOS DE UM PRODUTO
router.get('/:id_produto', (req, res, next) => {

    //const id = req.params.id_produto

    mysql.getConnection((error, conn) => {
        if(error){ return res.status(500).send({ error: error }) }
        conn.query(
            'SELECT * FROM produtos WHERE id_produtos = ?;',
            [req.params.id_produto],
            (error, result, fields) => {
                if(error){ return res.status(500).send({ error: error }) }
                // somente entrar, se nao tiver resultados
                if(result.length <= 0){
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado produto com este ID'
                    })
                }
                
                const response = {
                    produto: {
                        id_produto: result[0].id_produtos,
                        nome: result[0].nome,
                        preco: result[0].preco,
                        imagem_produto: result[0].imagem_produto,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna todos os produtos',
                            url: 'http://localhost:1000/produtos/'
                        }   
                    }
                }
                return res.status(200).send({response: response});
            }
        )
    });

});

// INSERE UM PRODUTO
router.post('/', login.obrigatorio, upload.single('produto_imagem'), (req, res, next) => {
    console.log(req.usuario);
    mysql.getConnection((error, conn) => {
        
        if(error){ return res.status(500).send({ error: error }) }

        conn.query(
            'INSERT INTO produtos (nome, preco, imagem_produto) VALUES (?, ?, ?)',
            [
                req.body.nome, 
                req.body.preco,
                req.file.path
            ],
            (error, result, field) => {
                conn.release();

                if(error){ return res.status(500).send({ error: error }) }
                const response = {
                    mensagem: 'Produto inserido com sucesso',
                    produtoCriado: {
                        id_produtos: result.id_produtos,
                        nome: req.body.nome,
                        preco: req.body.preco,
                        imagem_produto: req.file.path,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna todos os produtos',
                            url: 'http://localhost:1000/produtos/'
                        }
                    }
                }
                res.status(201).send(response);
            }    
        )
    });
});

// ALTERA UM PRODUTO
router.patch('/', login.obrigatorio, (req, res, next) => {
    mysql.getConnection((error, conn) => {
        
        if(error){ return res.status(500).send({ error: error }) }

        conn.query(
            `UPDATE produtos 
                SET nome        = ?,
                    preco       = ?
             WHERE id_produtos  = ?`,
            [
                req.body.nome, 
                req.body.preco,
                req.body.id_produtos
            ],
            (error, resultado, field) => {
                conn.release();

                if(error){ return res.status(500).send({ error: error }) }

                const response = {
                    mensagem: 'Produto alterado com sucesso',
                    produtoAlterado: {
                        id_produtos: req.body.id_produtos,
                        nome: req.body.nome,
                        preco: req.body.preco,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna o detalhe de um produto em especifico',
                            url: 'http://localhost:1000/produtos/' + req.body.id_produtos
                        }
                    }
                }
                res.status(202).send(response);
            }    
        )
    });
});

// EXCLUI UM PRODUTO
router.delete('/', login.obrigatorio, (req, res, next) => {
    mysql.getConnection((error, conn) => {
        
        if(error){ return res.status(500).send({ error: error }) }

        conn.query(
            'DELETE FROM produtos WHERE id_produtos  = ?',
            [req.body.id_produtos],
            (error, resultado, field) => {
                // console.log(error);
                conn.release();

                if(error){ return res.status(500).send({ error: error }) }
                const response = {
                    mensagem: 'Produto removido com sucesso!',
                    request: {
                        tipo: 'POST',
                        descricao: 'Insere um produto',
                        url: 'http://localhost:1000/produtos/',
                        body: {
                            nome: 'String',
                            preco: 'Number'
                        }
                    }
                }
                return res.status(202).send(response);
            }    
        )
    });
});

module.exports = router;