const express = require('express');
const router = express.Router();
const {hash, compare} = require('bcrypt');

const ObjectId = require('mongoose').Types.ObjectId;
const { USER_MODEL } = require('../models/user.model');
const UPLOAD_CONFIG  = require('../utils/multer-config');

router.get('/', (req, res)=>{
    res.redirect('/user/login');
});

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

        const infoUser = await USER_MODEL.findOne({email})
            .populate('guestRequest')
            .populate('friends');
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

router.get('/add-friend/:userReceiveAddFriendID', async (req, res)=>{
    try {
        const {email} = req.session;
        const {userReceiveAddFriendID} = req.params;

        if(!ObjectId.isValid(userReceiveAddFriendID))
            res.json({error: true, message: 'PARAM_INVALID'});
        
        let infoSenderAfterUpdate = await USER_MODEL.findOneAndUpdate({email}, {
            $addToSet: { friendsRequest: userReceiveAddFriendID}
        }, {new: true});

        let infoReceiveAfterUpdate = await USER_MODEL.findByIdAndUpdate(userReceiveAddFriendID,{
            $addToSet: { guestRequest: infoSenderAfterUpdate._id }
        }, {new: true});

        if(!infoSenderAfterUpdate || !infoReceiveAfterUpdate)
            return res.json({error: true, message: 'UPDATE_ERROR'});
        
        // res.json({ infoSender: infoSenderAfterUpdate, infoReceiver: infoReceiveAfterUpdate });
        res.redirect('/user/info');

    } catch (error) {
        res.json({error: true, message: error.message});
    }
});

router.get('/remove-request/:userReceiveRemoveRequestID', async (req, res) =>{
    try {
        let { email } = req.session;
        let { userReceiveRemoveRequestID } = req.params;

        if( !ObjectId.isValid( userReceiveRemoveRequestID ))
            res.json({ error: true, message: 'PARAM_VALID' });
        
        let infoRemoverAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { friendsRequest: userReceiveRemoveRequestID }
        }, { new: true });

        let infoReceiverRequestAfterUpdate = await USER_MODEL.findByIdAndUpdate(userReceiveRemoveRequestID, {
            $pull: { guestRequest: infoRemoverAfterUpdate._id}
        }, { new : true});

        if( !infoRemoverAfterUpdate || !infoReceiverRequestAfterUpdate)
            return res.json({ error: true, message: 'CANNOT_UPDATE' });

        res.redirect('/user/info');
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.get('/confirm-friend/:userBeConfirmedID', async (req, res)=>{
    try {
        const { email } = req.session; // user current
        const { userBeConfirmedID} = req.params; // user be comfirm
        
        if(!ObjectId.isValid(userBeConfirmedID))
            res.json({error: true, message: 'PARAM VALID'});
        
        /**
         * User current
         */
        let infoMainUserAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { guestRequest: userBeConfirmedID },
            $addToSet: { friends : userBeConfirmedID }
        }, { new: true });

        /**
         * User be confirm
         */
        let { _id: userMainID } = infoMainUserAfterUpdate;
        let infoUserBeConfirmedAfterUpdate = await USER_MODEL.findByIdAndUpdate(userBeConfirmedID, {
            $pull: { friendsRequest: userMainID },
            $addToSet: { friends: userMainID}
        }, { new: true });

        if( !infoMainUserAfterUpdate || !infoUserBeConfirmedAfterUpdate )
            return res.json({ error: true, message: 'CANNOT_UPDATE'});

        res.redirect('/user/info');
    } catch (error) {
        res.json({ user: true, message: error.message});
    }
});

router.get('/decline-friend/:userBeDeclineID', async (req, res)=>{
    try {
        const { email } = req.session;
        const { userBeDeclineID } = req.params;
    
        if( !ObjectId.isValid( userBeDeclineID ))
            res.json({ error: true, message: 'PARAM_VALID'});
        
        let infoUserCurrentAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { guestRequest: userBeDeclineID}
        }, { new: true });
    
        if( !infoUserCurrentAfterUpdate)
            return res.json({ error: true, message: 'CANNOT_UPDATE'});
    
        res.redirect('/user/info');
        
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.get('/remove-friend/:userBeRemoveID', async (req, res)=>{
    try {
        const { email } = req.session;
        const { userBeRemoveID } = req.params;
    
        if( !ObjectId.isValid( userBeRemoveID ))
            res.json({ error: true, message: 'PARAM_VALID'});
        
        let infoUserCurrentAfterUpdate = await USER_MODEL.findOneAndUpdate({ email }, {
            $pull: { friends: userBeRemoveID }
        }, { new: true });
        
        let { _id: userCurrentID } = infoUserCurrentAfterUpdate;
        let infoUserBeRemoveAfterUpdate = await USER_MODEL.findByIdAndUpdate(userBeRemoveID, {
            $pull: { friends: userCurrentID }
        }, { new: true });
    
        if( !infoUserCurrentAfterUpdate || !infoUserBeRemoveAfterUpdate)
            return res.json({ error: true, message: 'CANNOT_UPDATE'});
        
        res.redirect('/user/info');

    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

router.post('/register', UPLOAD_CONFIG.single('image'), async (req, res)=>{
    try {
        const { fullname, email, password} = req.body;
        const { filename } = req.file;

        let isExist = await USER_MODEL.findOne({email});
        if(isExist) res.json({error: true, message: 'USER_IS_EXIST'});

        let passHash = await hash(password, 8);
        if(!passHash) res.json({error: true, message: 'CANNOT_HASH_PASSWORD'});

        let infoUser = new USER_MODEL({fullname, email, password: passHash, image: filename});
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
        res.redirect('/');
    } catch (error) {
        res.json({error: true, message: error.message});
    }
});

exports.USER_ROUTTER = router;