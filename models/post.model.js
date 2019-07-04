const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostsSchema = new Schema({
    title: String,
    description: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    amountView : { type: Number, default: 0 },
    liker: [
        {
            type: Schema.Types.ObjectId,
            ref: 'user'
        }
    ]
});

const Post = mongoose.model('post', PostsSchema);

exports.POST_MODEL = Post;