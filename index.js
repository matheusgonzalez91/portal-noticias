const express = require('express');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
var session = require('express-session');

const path = require('path');

const app = express();

const Posts = require('./Posts.js');
const { validate } = require('./Posts.js');

mongoose.connect('mongodb+srv://root:zZeneY4zYhRu4nkg@cluster0.gpn8gch.mongodb.net/gonzalez?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log('Conectado com sucesso!')
}).catch((err) => {
    console.log(err.message);
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({ secret: 'keyboard cat', cookie: {maxAge: 60000} }));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));

app.get('/', (req, res) =>{
    if(req.query.busca == null){
        Posts.find({}).sort({'_id': -1}).exec((err, posts) =>{
            posts = posts.map((val) =>{
                return {
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 150),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                }
            })

            Posts.find({}).sort({'views': -1}).limit(3).exec((err, postsTop) =>{
                postsTop = postsTop.map((val) =>{
                    return{
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 150),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }
                })
                res.render('home', {posts:posts, postsTop:postsTop});
            })
            
        })
        
    }else{
        Posts.find({titulo: {$regex: req.query.busca, $options:'i'}}, (err, posts) =>{
            posts = posts.map((val) =>{
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 150),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                    views: val.views
                }
            })
            res.render('busca', {posts:posts, contagem:posts.length});
        })
    }
});

app.get('/:slug', (req, res) =>{
    Posts.findOneAndUpdate({slug: req.params.slug}, {$inc: {views: 1}}, {new: true}, (err, resposta) =>{
        if(resposta != null){
            Posts.find({}).sort({'views': -1}).limit(3).exec((err, postsTop) =>{
                postsTop = postsTop.map((val) =>{
                    return{
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 150),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }
                })
                res.render('single', {noticia:resposta, postsTop:postsTop});
            })
        }else{
            res.redirect('/');
        } 
    })
});

var usuarios = [
    {
        login: 'Matheus',
        password: '286390ma'
    }
]

app.post('/admin/login', (req, res) =>{
    usuarios.map((val) =>{
        if(val.login == req.body.login && val.password == req.body.password){
            req.session.login = 'Matheus';
        }
    })
    res.redirect('/admin/login');
});

app.post('/admin/cadastro', (req, res)=>{
    console.log(req.body);
    Posts.create({
        titulo: req.body.tituloNoticia,
        imagem: req.body.urlImagem,
        categoria: 'Null',
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor: 'Admin',
        views: 0
    });
    res.send('Cadastro realizado com sucesso!')
});

app.get('/admin/deletar/:id', (req, res) =>{
    res.send('Noticia delatada com sucesso com o ID: ' + req.params.id);
});

app.get('/admin/login', (req, res)=>{
    if(req.session.login == null){
        res.render('admin-login');
    }else{
        res.render('admin-panel');
    }  
})

//Servidor
app.listen(5000, () =>{
    console.log('Servidor Rodando');
})