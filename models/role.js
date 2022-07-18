const { Schema, model } = require('mongoose');

const roleSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
}, {
    statics: {
        findWithUsersCount() {
            return model('Role').aggregate([
                { $lookup: { from: "users", localField: "_id", foreignField: "roleId", as: "usersCount" } },
                { $addFields: { usersCount: { $size: "$usersCount" } } }
            ]);
        }
    }
});

// roleSchema.methods.findWithUsersCount = function(cb) {
//     return model('Role').aggregate([
//         { $lookup: { from: "users", localField: "_id", foreignField: "roleId", as: "usersCount" } },
//         { $addFields: { usersCount: { $size: "$usersCount" } } }
//     ]);
//   };

module.exports = model('Role', roleSchema);