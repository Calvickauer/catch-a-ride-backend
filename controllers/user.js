// Imports
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { JWT_SECRET } = process.env;

// DB Models
const User = require('../models/user');

// Controllers
router.get('/test', (req, res) => {
    res.json({ message: 'User endpoint OK! ✅' });
});

router.post('/signup', (req, res) => {
    // POST - adding the new user to the database
    console.log('===> Inside of /signup');
    console.log('===> /register -> req.body',req.body);

    User.findOne({ email: req.body.email })
    .then(user => {
        // if email already exists, a user will come back
        if (user) {
            // send a 400 response
            return res.status(400).json({ message: 'Email already exists' });
        } else {
            // Create a new user
            const newUser = new User({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                birthdate: req.body.birthdate,
                password: req.body.password
            });

            // Salt and hash the password - before saving the user
            bcrypt.genSalt(10, (err, salt) => {
                if (err) throw Error;

                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) console.log('==> Error inside of hash', err);
                    // Change the password in newUser to the hash
                    newUser.password = hash;
                    newUser.save()
                    .then(createdUser => res.json({ user: createdUser}))
                    .catch(err => {
                        console.log('error with creating new user', err);
                        res.json({ message: 'Error occured... Please try again.'});
                    });
                });
            });
        }
    })
    .catch(err => { 
        console.log('Error finding user', err);
        res.json({ message: 'Error occured... Please try again.'})
    })
});

router.post('/login', async (req, res) => {
    // POST - finding a user and returning the user
    console.log('===> Inside of /login');
    console.log('===> /login -> req.body', req.body);

    const foundUser = await User.findOne({ email: req.body.email });
    console.log('===>user', foundUser);

    if (foundUser) {
        // user is in the DB
        let isMatch = await bcrypt.compare(req.body.password, foundUser.password);
        console.log('Does the passwords match?', isMatch);
        if (isMatch) {
            // if user match, then we want to send a JSON Web Token
            // Create a token payload
            // add an expiredToken = Date.now()
            // save the user
            const payload = {
                id: foundUser.id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                birthdate: foundUser.birthdate,
                email: foundUser.email
            }

            jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
                if (err) {
                    res.status(400).json({ message: 'Session has endedd, please log in again'});
                }
                const legit = jwt.verify(token, JWT_SECRET, { expiresIn: 60 });
                console.log('===> legit', legit);
                res.json({ success: true, token: `Bearer ${token}`, userData: legit });
            });

        } else {
            return res.status(400).json({ message: 'Email or Password is incorrect' });
        }
    } else {
        return res.status(400).json({ message: 'User not found' });
    }
});

// private
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
   User.findById(req.user.id).populate('journey').populate('vehicle').populate('reviews').exec()
   .then(user => {
    console.log('====> inside /profile');
    console.log(req.body);
    console.log('====> user')
    console.log(req.user);
    const { id, firstName, lastName, email, journey, vehicle, reviews, photos } = user; // object with user object inside
    const rev =  reviews.map((r, idx) => {
        return ({content: r.content,
            title: r.title,
        id: r.id, key: idx});
      })
    res.json({ id, firstName, lastName, email, journey, vehicle, rev, photos });
   }).catch(err => {
    console.log('ERROR', err)
   })
   
});

router.get('/profile/go/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findById(req.params.id).populate('journey').populate('vehicle').populate('reviews').exec()
    .then(user => {
     console.log('====> inside /profile');
     console.log(req.body);
     console.log('====> user')
     console.log(req.user);
     const { id, firstName, lastName, email, journey, vehicle, reviews, photos } = user; // object with user object inside
      const rev =  reviews.map((r, idx) => {
        return {content: r.content,
        id: r.id}
      })

     res.json({ id, firstName, lastName, email, rev, photos});
   
    }).catch(err => {
     console.log('ERROR')
    })
    
 });

 router.put('/edit', passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log('route is being on PUT')
    User.findById(req.user.id)
    .then(foundUser => {
        console.log('Message found', foundUser);
        User.findByIdAndUpdate(foundUser.id, { 
                firstName: req.body.firstName ? req.body.firstName : foundMsg.firstName,
                lastName: req.body.lastName ? req.body.lastName : foundMsg.lastName,
        }, { 
            upsert: true 
        })
        .then(user => {
            console.log('User was updated', user);
            res.send(user);
        })
        .catch(error => {
            console.log('error', error) 
            res.json({ message: "Error ocurred, please try again" })
        })
    })
    .catch(error => {
        console.log('error', error) 
        res.json({ message: "Error ocurred, please try again" })
    })
});

//Exports
module.exports = router;
