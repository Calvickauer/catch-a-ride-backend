// Imports
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { JWT_SECRET } = process.env;
const User = require('../models/user');

// DB Models
const Journey = require('../models/journey');

// Controllers


// GET route display all journeys for one user
router.get('/mine', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.find({driverUid: req.user.id})
        .then(journeys => {
            console.log('All journeys', journeys);
            res.json(journeys);
        })
        .catch(error => {
            console.log(error)
        });
});

// router.get('/', (req, res) => {
//     res.json({ message: 'Journeys endpoint OK! ✅' });
// });


// show all journeys from all users
router.get('/all', (req, res) => {
    Journey.find({}).populate('driverUid')
        .then(journeys => {
            console.log('All journeys', journeys);
            res.json(journeys);
        })
        .catch(error => {
            console.log(error)
        });
});

router.get('/return', (req, res) => {
    res.json({deleted: 'Deleted'});
});

// GET route display one journey
router.get('/show/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log('testing GET id route');
    Journey.findById(req.params.id).populate('messages').populate('driverUid').populate('passengerUids').exec()
    .then(journey => {
        console.log(journey);
        res.json({journey: journey});
    })
    .catch(error => {
        console.log(error)
    });
});


// POST route add new journey
router.post('/new', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findById(req.user.id).then(user => {
        Journey.create({
            origin: req.body.origin,
            destination: req.body.destination,
            contribution: req.body.contribution,
            openSeats: req.body.openSeats,
            date: req.body.date
        })    
        .then(newJourney => {
            user.journey.push(newJourney);
            newJourney.driverUid.push(user)
            newJourney.save();
            user.save();
            console.log('New journey created', newJourney);
            res.send(newJourney);
            // res.redirect(`/journeys/show/${newJourney._id}`)
        })
        .catch(err => {
            console.log('Error in example#create:', err);
            res.json({ message: 'Error occured... Please try again.'});
        })
    })

});


router.post('/request', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findById(req.user.id).then(user => {
        Journey.create({
            origin: req.body.origin,
            destination: req.body.destination,
            contribution: req.body.contribution,
            openSeats: req.body.openSeats,
            date: req.body.date
        })    
        .then(newJourney => {
            user.journey.push(newJourney);
            newJourney.passengerUids.push(user)
            newJourney.save();
            user.save();
            console.log('New journey created', newJourney);
            res.send(newJourney);
            // res.redirect(`/journeys/show/${newJourney._id}`)
        })
        .catch(err => {
            console.log('Error in example#create:', err);
            res.json({ message: 'Error occured... Please try again.'});
        })
    })

});

// to add passengers
router.post('/:id/passenger/:uid', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.findById(req.params.id).populate('messages').populate('driverUid').populate('passengerUids').exec()
    .then(journey => {
        User.findById(req.params.uid) // need to edit this so that it pulls user ID from the user who sent the message
        .then(user => {
            journey.passengerUids.push(user);
            journey.save();
            console.log(journey);
            res.send(journey);
        });
    })
    .catch(error => {
        console.log(error)
    });
});

// PUT route edit one journey
router.put('/edit/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.findById(req.params.id)
        .then(foundJourney => {
            console.log('journey found', foundJourney);
            Journey.findByIdAndUpdate(req.params.id,
                {
                    origin: req.body.origin ? req.body.origin : foundJourney.origin,
                    destination: req.body.destination ? req.body.destination : foundJourney.destination,
                    contribution: req.body.contribution ? req.body.contribution : foundJourney.contribution,
                    openSeats: req.body.openSeats ? req.body.openSeats : foundJourney.openSeats,
                    date: req.body.date ? req.body.date : foundJourney.date
                })
                .then(journey => {
                    console.log('Journey was updated', journey);
                    // res.redirect(`/journeys/show/${journey.id}`)
                    res.send(journey);
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

// DELETE route remove one journey (do we need to make it so that you cannot remove past journeys?)
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.findByIdAndRemove(req.params.id)
    .then(journey => {
        console.log(journey._id, 'has been deleted');
        res.redirect('/users/profile'); 
    })
    .catch(error => {
        console.log(error)
    });
});

// DELETE route to remove one passenger
router.delete('/:id/passengers/:pId/remove', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.findById(req.params.id)
    .then(journey => {
        let array = journey.passengerUids;
        let target = array.indexOf(req.params.pId);
        if (target > -1) {
            array.splice(target, 1);
        };
        journey.save();
        res.send(journey);
    })
    .catch(error => {
        console.log('error', error)
        res.json({ message: "Error ocurred, passenger not deleted" })
    });
});


// DELETE route for passenger to remove themselves
router.delete('/:id/passengers/leave', passport.authenticate('jwt', { session: false }), (req, res) => {
    Journey.findById(req.params.id)
    .then(journey => {
        let array = journey.passengerUids;
        let target = array.indexOf(req.user.id);
        if (target > -1) {
            array.splice(target, 1);
        };
        journey.save();
        res.send(journey);
    })
    .catch(error => {
        console.log('error', error)
        res.json({ message: "Error ocurred, passenger not deleted" })
    });
});

// Exports
module.exports = router;