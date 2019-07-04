const express = require('express');
const router = express.Router();

const { POST_MODEL } = require('../models/post.model');
const { USER_MODEL } = require('../models/user.model');

router.get('/', (req, res) => {
    let { email } = req.session;
        if(!email) res.redirect('/user/login');
    res.render('post')
});

router.get('/list', async (req, res)=>{
    try {
        let { email } = req.session;
            if(!email) res.redirect('/user/login');

        let inforUser = await USER_MODEL.findOne({ email});
        if(!inforUser) res.json({ error: true, message: 'USER_NOT_EXIST'});

        let listPost = await POST_MODEL.find({ author: inforUser._id });
        if(!listPost) res.json({ error: true, message: 'CANNOT_GET_LIST'});

        res.render('list-post', { listPost });
        
    } catch (error) {
        return res.json({ error: true, message: error.message});
    }
});

router.get('/like/:postID', async (req, res)=>{
    try {
        let { email } = req.session;
            if(!email) res.redirect('/user/login');
        let { postID } = req.params;

        let infoUser = await USER_MODEL.findOne({ email });
        let postAfterUpdate = await POST_MODEL.findByIdAndUpdate(postID, {
            $addToSet: { liker: infoUser._id}
        }, { new: true });
        
        if( !infoUser || !postAfterUpdate)
            res.json({ error: true, message: 'CANNOT_UPDATE_LIKER'});
        console.log({postAfterUpdate}, { liker: postAfterUpdate.liker});
        res.redirect('/');
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.post('/new', async (req, res)=>{
    try {
        let { email } = req.session;
            if(!email) res.redirect('/user/login');

        let infoUser = await USER_MODEL.findOne({ email });
        if( !infoUser ) res.json({ error: true, message: 'USER_NOT_EXIST'});

        const { title, description } = req.body;

        let infoPost = new POST_MODEL({ title, description, author: infoUser._id });
        let infoPostAfterInsert = await infoPost.save();
        
        if( !infoPostAfterInsert ) res.json({ error: true, message: 'CANNOT_SAVE_RECORD' });

        res.redirect('/post/list');
    } catch (error) {
        return res.json({ error: true, message: error.message });
    }
});

exports.POST_ROUTER = router;