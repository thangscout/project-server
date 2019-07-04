const express = require('express');
const router = express.Router();

router.get('/', (req, res)=>{
    res.render('post');
});

exports.POST_ROUTER = router;