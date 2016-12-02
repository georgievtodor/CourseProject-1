'use strict';

const passport = require('passport');

module.exports = (data) => {
    return {
        loadRegisterPage(req, res) {
            return res.status(200).render('register', { result: {} });
        },
        loadLoginPage(req, res) {
            return res.status(200).render('login', { result: {} });
        },
        register(req, res) {
            const user = {
                username: req.body.username,
                passHash: req.body.password,
                salt: req.body.salt,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                birthDate: req.body.birthDate,
                image: req.file ? req.file.filename : 'default.png',
                email: req.body.email,
                competitions: {},

            };

            data.createUser(user)
                .then(() => {
                    res.json({ success: 'Registration successfull' })
                })
                .catch(() => {
                    // TODO: redirect to another page
                    res.json({ error: 'Registration failed' })
                    res.status(500).end();
                });
        },
        loginLocal(req, res, next) {
            const auth = passport.authenticate('local', (err, user) => {
                if (err) {
                    next(err);
                    return;
                }

                if (!user) {
                    res.json({ error: 'Invalid username or password' });
                }

                req.login(user, err => {
                    if (err) {
                        next(err);
                        return;
                    }

                    res.status(201).redirect('/home');
                });
            });

            auth(req, res, next);
        },
        logout(req, res) {
            req.logout();
            res.status(200).redirect('/home');
        },
        loginUserFacebook(req, res, next) {
            const auth = passport.authenticate('facebook', { scope: ['user'] }, function (error, user) {
                if (error) {
                    next(error);
                    return;
                }

                if (!user) {
                    res.json({ error: 'Invalid name or password!' });
                }

                req.login(user, error => {
                    if (error) {
                        next(error);
                        return;
                    }

                    res.redirect('/home');
                });
            });

            auth(req, res, next);
        },
        facebookAuthenticate(req, res) {
            passport.authenticate('facebook')(req, res);
        }
    }
}