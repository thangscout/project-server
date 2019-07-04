const express = require('express');
const app = express();
const port = 3000;

const mongoose       = require('mongoose');
const bodyParser     = require('body-parser');
const expressSession = require('express-session');
const {URI_MONGOOSE} = require('./constant/index');

const { USER_ROUTTER }  = require('./routers/user.router');
const { POST_ROUTER }   = require('./routers/post.router');
const { POST_MODEL } = require('./models/post.model');
const { USER_MODEL } = require('./models/user.model');

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static('./public'));

app.use(expressSession({
    secret: 'MERN_STACK_0106',
    resave: false,
    saveUninitialize: true,
    cookie: {
        maxAge: 300000
    }
}));

app.use('/user', USER_ROUTTER);
app.use('/post', POST_ROUTER);

app.get('/', async (req, res)=>{
    let { email } = req.session;
        if(!email) res.redirect('/user/login');

    let infoUser = await USER_MODEL.findOne({ email });
    let listPost = await POST_MODEL.find({}).populate('author');
    console.log({listPost})
    res.render('all-post', { listPost , infoUser});
});

mongoose.connect(URI_MONGOOSE);
mongoose.connection.once('open', ()=>{
    console.log('Mongo client started');
    app.listen(port, ()=> console.log(`Server start at port ${port}`));
});