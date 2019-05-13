const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true, // guarentee there won't be two user with the same email
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if ( value < 0 ) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    password: {
        type: String,
        minlength: 7,
        required: true,
        trim: true,
        validate(value) {
            if ( value.toLowerCase().includes('password') ) {
                throw new Error('Password cannot contain the word "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true
        }
    }],
    avatar: {
        type: Buffer // enables to save image as binary data from the buffer
    }
},{ // Second argument to new mongoose.Schema: Options
    timestamps: true
})

// .methods work on the 'instance' user
// regular fn because using 'this' for the user instance
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar // too big, no need since we can get it from route url

    return userObject
}

// .satics works on the 'class' User
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Below, using Mongoose middleware:
// ---------------------------------
// Using a regular function as second argument of 'pre' because
// we need to access 'this' in the 'pre' body. 'this' refers
// to the document beeing saved (since we are using the 'save' event)
// what is 'next'?
// --------------
// Since the middleware 'pre' happens before saving the user, next()
// indicates that we can continue with saving... that we are done doing
// middleware stuff:

// MIDDLEWARE: Hash the plain text password before saving
userSchema.pre('save', async function (next) { // use regular fn because using 'this'
    const user = this // just nicer to use 'user' than 'this'

    // only want to hash if the password has not been hashed before
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// MIDDLEWARE: Delete user tasks when user is removed:
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
