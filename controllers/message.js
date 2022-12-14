// Imports
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { JWT_SECRET } = process.env;
const mongoose = require('mongoose');


// DB Models
const Message = require('../models/message');
const Reply = require('../models/reply');
const Journey = require('../models/journey');
const User = require('../models/user');


router.get('/', (req, res) => {
    res.json({ message: 'Messages endpoint OK! ✅' });
});

// show all messages from all users, for test only

router.get('/test', (req, res) => {
    Message.find({}).populate('replies').exec()
        .then(msg => {
            res.json({ message: msg });
        })
        .catch(error => {
            console.log('error', error);
            res.json({ message: "Error ocurred, please try again" });
        });
});



// return route from delete ===> for now

router.get('/return', (req, res) => {
    res.json({ deleted: 'Deleted' });
});




// get 1 message by it's Id coming as params

router.get('/show/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    Message.findById(req.params.id).populate('replies').populate('user').populate('journey').exec()
        .then(msg => {
            res.json({ message: msg });
        })
        .catch(error => {
            console.log('error', error);
            res.json({ message: "Error ocurred, please try again" });
        });
});


// create a new message

// router.post('/new', passport.authenticate('jwt', { session: false }), async (req, res) => {
//     console.log('body', req.body);
//     console.log('user', req.user);
//     User.findById(req.user._id)
//         .then(user => {
//             Message.create({
//                 title: req.body.title,
//                 content: req.body.content
//             }).then(message => {
//                 message.user.push(user);
//                 user.messages.push(message);
//                 res.redirect(`/messages/show/${message.id}`);
//                 message.save();
//                 user.save();
//             })

//         }).catch(err => {
//             console.log(err);
//         });
// });

// send new message (pushes message to journey model)
router.post('/:id/new', passport.authenticate('jwt', { session: false }), async (req, res) => {
    console.log('body', req.body);
    console.log('user', req.user);
    User.findById(req.user.id)
        .then(user => {
            Journey.findById(req.params.id)
                .then(journey => {
                    Message.create({
                        title: req.body.title,
                        content: req.body.content
                    }).then(message => {
                        message.user.push(user);
                        message.journey.push(journey);
                        journey.messages.push(message);
                        user.messages.push(message);
                        message.save();
                        user.save();
                        journey.save();
                        res.send(message);
                    })
                })
                .catch(err => {
                    console.log(err);
                });
        }).catch(err => {
            console.log(err);
        });
});

//edit one message find by id

router.put('/edit/:id', (req, res) => {
    console.log('route is being on PUT')
    Message.findById(req.params.id)
        .then(foundMsg => {
            console.log('Message found', foundMsg);
            Message.findByIdAndUpdate(req.params.id, {
                title: req.body.title ? req.body.title : foundMsg.title,
                content: req.body.content ? req.body.content : foundMsg.content,
            }, {
                upsert: true
            })
                .then(post => {
                    console.log('Post was updated', post);
                    res.send(post);
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

// delete one message
router.delete('/delete/:id', (req, res) => {
    Message.findByIdAndRemove(req.params.id)
        .then(response => {
            res.redirect(`/return`);
        })
        .catch(err => {
            console.log('Error in vehicle delete:', err);
            res.json({ message: 'Error occured... Please try again.' });
        });
});

// show all messages sent to user
router.get('/inbox', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.find({ driverUid: req.user.id, messages: { $ne: [] } }).populate({path:'messages', populate:{path:'user', model:'User'}}).populate('user').exec()
        .then(journeys => {
            res.send(journeys);
        })
        .catch(error => {
            console.log(error)
        });
});

// router.get('/inbox', passport.authenticate('jwt', { session: false }), (req, res) => {
//     Message.find().populate('journey', {driverUid: req.user.id}).populate('user').exec()
//     .then(messages => {
//         res.send(messages);
//     })
//     .catch(error => {
//         console.log(error)
//     });
// });

module.exports = router;