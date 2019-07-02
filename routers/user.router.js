const express = require('express');
const router = express.Router();
const {hash, compare} = require('bcrypt');

const { USER_MODEL } = require('../models/user.model');
const ObjectId = require('mongoose').Types.ObjectId;

router.get('/register', (req, res)=>{
    res.render('register');
});

router.get('/login', (req, res)=>{
    res.render('login');
});

router.get('/info', async (req, res)=>{
    try {
        const {email} = req.session;
        if(!email) res.json({error: true, message: 'PERMISSION_DENIED'});

        const infoUser = await USER_MODEL.findOne({email});
        if(!infoUser) res.json({error: true, message: 'CANNOT_GET_USER'});

        /**
         * get List user
         */
        let listUser = await USER_MODEL.find({
            email: { $ne: email }
        });
        console.log({listUser, infoUser});

        // res.json({ infoUser});
        res.render('info', { infoUser, listUser });
    } catch (error) {
        res.json({error: true, message: error.message});
    }
});

router.post('/register', async (req, res)=>{
    try {
        const { fullname, email, password} = req.body;

        let isExist = await USER_MODEL.findOne({email});
        if(isExist) res.json({error: true, message: 'USER_IS_EXIST'});

        let passHash = await hash(password, 8);
        if(!passHash) res.json({error: true, message: 'CANNOT_HASH_PASSWORD'});

        let infoUser = new USER_MODEL({fullname, email, password: passHash});
        let infoInserted = await infoUser.save();

        if(!infoInserted) res.json({error: true, message: 'CANNOT_INSERT_USER'});
        // res.json({ infoInserted});
        res.redirect('login');
    } catch (error) {
        res.json({error: true, message: error.message});
    }
});

router.post('/login', async (req, res)=>{
    try {
        const {fullname, email, password} = req.body;

        let isExist = await USER_MODEL.findOne({email});
        if(!isExist) res.json({error: true, message:'EMAIL_NOT_EXISTENCE'});

        let isMatching = await compare(password, isExist.password);
        if(!isMatching) res.json({error:true, message: 'PASSWORD_NOT_MATCHING'});

        /**
         * Json Web Token
         */
        req.session.email = isExist.email;
        // res.json({error: false, message:'LOGIN_SUCCESS'});
        res.redirect('info');
    } catch (error) {
        res.json({error: true, message: error.message});
    }
});

router.get('/add-friend/:userReceiveAddFriendID', async (req, res)=>{
    try {
        const {email} = req.session;
        const {userReceiveAddFriendID} = req.params;

        if(!ObjectId.isValid(userReceiveAddFriendID))
            res.json({error: true, message: 'PARAM_INVALID'});
        
        let infoSenderAfterUpdate = await USER_MODEL.findOneAndUpdate(email, {
            $addToSet: { friendsRequest: userReceiveAddFriendID}
        }, {new: true});

        let infoReceiveAfterUpdate = await USER_MODEL.findByIdAndUpdate(userReceiveAddFriendID,{
            $addToSet: { guestRequest: infoSenderAfterUpdate._id }
        }, {new: true});

        if(!infoSenderAfterUpdate || !infoReceiveAfterUpdate)
            res.json({error: true, message: 'UPDATE_ERROR'});
        
        // res.json({ infoSender: infoSenderAfterUpdate, infoReceiver: infoReceiveAfterUpdate });
        res.redirect('/user/info');

    } catch (error) {
        res.json({error: true, message: error.message});
    }
});


exports.USER_ROUTTER = router;