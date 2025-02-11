const mongoose = require('mongoose')
const bycrypt = require('bcryptjs')
//const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,'Please provide the name'],
        minlength : 3,
        maxlength:20
    },
    email:{
        type:String,
        required:[true,'Plase provide the email'],
        match: [
             /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email address"
          ],
          unique:true
    },
    password:{
        type:String,
        required: [true,'Please provide the password'],
        minlength :5
    }

})

//hash the password before saving it
UserSchema.pre('save', async function(){
     //generate random bytes
    const salt = await bycrypt.genSalt(10);
    //hashed the password
    this.password = await bycrypt.hash(this.password,salt)
})

//create token
UserSchema.methods.createJWT= function(){
    return jwt.sign({
        userId : this._id, name:this.name},
    process.env.JWT_SECRET,
    {
    expiresIn: process.env.JWT_LIFETIME
    })
}

//compare password
UserSchema.methods.comparePassword = async function(userPassword) {
    const isMatch = await bycrypt.compare(userPassword, this.password)
    return isMatch
}

module.exports = mongoose.model("User", UserSchema);