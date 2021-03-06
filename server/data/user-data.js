'use strict';

const hashing = require('../utilities/encryptor');

module.exports = function(models, validator) {
    const User = models.User;

    return {
        getAllUsers() {
            return new Promise((resolve, reject) => {
                User.find((err, users) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(users);
                });
            })
        },
        getTopUsers() {
            return new Promise((resolve, reject) => {
                User.find({}, {}, { limit: 10, sort: { 'progress.totalPoints': -1 }, }, (err, users) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(users);
                })
            });
        },
        getUserById(id) {
            return new Promise((resolve, reject) => {
                User.findOne({ '_id': id }, (err, user) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!user) {
                        return resolve(null);
                    }

                    return resolve(user);
                });
            })
        },
        getUserByUsername(username, asPersonalPage) {
            return new Promise((resolve, reject) => {
                User.findOne({ 'username': username }, (err, user) => {
                    if (err) {
                        return reject(err);
                    }

                    if (!user) {
                        return reject({ error: 'User not found' });
                    }
                    const joinedCompetitions = [];
                    const attendedCompetitions = [];

                    user.competitions.forEach(c => {
                        if (c.attended) {
                            attendedCompetitions.push(c);
                        } else if (asPersonalPage) {
                            joinedCompetitions.push(c);
                        }
                    });

                    user.attendedCompetitions = attendedCompetitions;
                    if (asPersonalPage) {
                        user.joinedCompetitions = joinedCompetitions;
                    }
                    return resolve(user);
                });
            });
        },
        createUser(user) {
            return new Promise((resolve, reject) => {

                const salt = hashing.getSalt(),
                    passHash = hashing.getPassHash(salt, user.passHash);
                if (!validator.isValidUser(user)) {
                    return reject({ error: 'Invalid information' });
                }
                const newUser = new User({
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    passHash: passHash,
                    salt: salt,
                    birthDate: user.birthDate,
                    email: user.email,
                    image: user.image,
                    competitions: [],
                    progress: {
                        totalPoints: 0,
                        categoriesPoints: []
                    },
                    roles: ['normal'],
                    facebookId: user.facebookId
                        // facebookToken: user.facebookToken
                });

                newUser.save(err => {

                    if (err) {
                        return reject(err);
                    }

                    return resolve(newUser);
                });
            });
        },
        addCompetitionToUser(username, competition) { //competition object is created in the controller
            return new Promise((resolve, reject) => {
                User.findOneAndUpdate({ 'username': username }, { $push: { 'competitions': competition } },
                    (err, user) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(user);
                    })
            });
        },
        removeCompetitionFromUser(username, competitionId) {
            return new Promise((resolve, reject) => {
                User.update({ username }, { $pull: { 'joinedCompetitions': { _id: competitionId } } }, (err, user) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(user);
                });
            });
        },
        updateUserInRole(userId, role) {
            return new Promise((resolve, reject) => {
                User.findByIdAndUpdate({ '_id': userId }, { $push: { 'roles': role } },
                    (err, user) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(user);
                    });
            });
        },
        updateUserInformation(username, newInfo) {
            return new Promise((resolve, reject) => {
                User.findOneAndUpdate({ username }, newInfo,
                    (err, user) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(user);
                    })
            });
        },
        updatePoints(username, points, category) {
            return new Promise((resolve, reject) => {
                if (!validator.isValidPoints(points)) {
                    reject({ error: 'Invalid points count' });
                }
                let currentPoints = 0;
                const user = User.findOne({ username })
                    .then((user) => {
                        currentPoints = user.progress.totalPoints + points;
                        const categoryPoints = user.progress.categoriesPoints || [];
                        if (categoryPoints.length === 0 || !categoryPoints.map(x => x.name).includes(category)) {
                            categoryPoints.push({
                                name: category,
                                points
                            })
                        } else {
                            categoryPoints.forEach(el => {
                                if (el.name === category) {
                                    el.points += +points;
                                }

                            });
                        }
                        return { currentPoints, categoryPoints };
                    }).then(newPoints => {
                        return new Promise((res, rej) => {
                            User.findOneAndUpdate({ username }, { $set: { 'progress.totalPoints': newPoints.currentPoints, 'progress.categoriesPoints': newPoints.categoryPoints } },
                                (err, user) => {
                                    if (err) {
                                        return rej(err);
                                    }

                                    if (user.progress.totalPoints < User.getOrganizatorMinimumPoints() || user.roles.indexOf('organizator') > -1) {
                                        return res(user);
                                    }

                                    return this.updateUserInRole(user._id, 'organizator');
                                })
                        })
                    })
                    .then((user) => {
                        return resolve(user);
                    })
                    .catch(err => {
                        reject(err);
                    })
            });
        },
        findUserWithIdAndName(query) {
            return new Promise((resolve, reject) => {
                User.find(query)
                    .select('_id username')
                    .exec((err, users) => {
                        if (err) {
                            return reject(err);
                        }

                        return resolve(users);
                    });
            });
        },
        getCountOfFilteredUsers(name) {
            const regex = { $regex: new RegExp(`.*${name}.*`, 'i') },
                usernameRegex = { username: regex },
                firstNameRegex = { firstName: regex },
                lastNameRegex = { lastName: regex };

            return new Promise((resolve, reject) => {
                User.count({ $or: [usernameRegex, firstNameRegex, lastNameRegex] }, function(err, usersCount) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(usersCount);
                })
            })
        },
        searchUsersByName(name, page, size) {
            const regex = { $regex: new RegExp(`.*${name}.*`, 'i') },
                usernameRegex = { username: regex },
                firstNameRegex = { firstName: regex },
                lastNameRegex = { lastName: regex },
                skip = (page - 1) * size,
                limit = size;
            return new Promise((resolve, reject) => {
                User.find({ $or: [usernameRegex, firstNameRegex, lastNameRegex] }, {}, { skip: skip, limit: limit }, function(err, users) {
                    if (err) {
                        return reject(err);
                    };

                    return resolve(users);
                });
            });
        },
        findUserByFacebookId(facebookId) {
            return new Promise((resolve, reject) => {
                User.findOne({ facebookId }, (err, user) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(user);
                })
            })
        }
    };
}