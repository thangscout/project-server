const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
    fullname: {type: String, required: true},
    age: String,
    /**
     * email is unique
     */
    email: { type: String, required: true, trim: true, unique: true},
    password: {type: String, required: true},
    image: {type: String},
    /**
     * Users is friend
     */
    friends: [
        {
            type:Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
    /**
     * Users sent invitation make friend
     */
    guestRequest: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
    /**
     * I'm send invitation make friend
     */
    friendsRequest: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
    /**
     * -1. yet confirm
     *  1.Active
     *  0.Banned
     */
    status: {type: Number, default: -1}
});

const User = mongoose.model('user', UsersSchema);

exports.USER_MODEL = User;