const functions = require('firebase-functions');
const https = require('https');

const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.addLike = functions.firestore.document('/posts/{creatorId}/userPosts/{postId}/likes/{userId}')
    .onCreate((snap, context) => {
        return db
            .collection("posts")
            .doc(context.params.creatorId)
            .collection("userPosts")
            .doc(context.params.postId)
            .update({
                likesCount: admin.firestore.FieldValue.increment(1)
            })
    });
exports.removeLike = functions.firestore.document('/posts/{creatorId}/userPosts/{postId}/likes/{userId}')
    .onDelete((snap, context) => {
        return db
            .collection('posts')
            .doc(context.params.creatorId)
            .collection('userPosts')
            .doc(context.params.postId)
            .update({
                likesCount: admin.firestore.FieldValue.increment(-1)
            })
    })

exports.addSave = functions.firestore.document('/saves/{userId}/userSaves/{postId}')
    .onCreate((snap, context) => {
        const creatorId = snap.data().creatorId;
        if (!creatorId) {
            return null;
        }
        return db
            .collection("posts")
            .doc(creatorId)
            .collection("userPosts")
            .doc(context.params.postId)
            .update({
                savesCount: admin.firestore.FieldValue.increment(1)
            })
    });
exports.removeSave = functions.firestore.document('/saves/{userId}/userSaves/{postId}')
    .onDelete((snap, context) => {
        const creatorId = snap.data().creatorId;
        if (!creatorId) {
            return null;
        }
        return db
            .collection('posts')
            .doc(creatorId)
            .collection('userPosts')
            .doc(context.params.postId)
            .update({
                savesCount: admin.firestore.FieldValue.increment(-1)
            })
            .catch(() => null)
    })


exports.addFollower = functions.firestore.document('/following/{userId}/userFollowing/{FollowingId}')
    .onCreate((snap, context) => {
        return db
            .collection('users')
            .doc(context.params.FollowingId)
            .update({
                followersCount: admin.firestore.FieldValue.increment(1)
            }).then(() => {
                return db
                    .collection('users')
                    .doc(context.params.userId)
                    .update({
                        followingCount: admin.firestore.FieldValue.increment(1)
                    })
            })
    })

// Sends an Expo push notification (same payload as the client `sendNotification` action).
const sendPushNotification = (to, title, body, data) => {
    const payload = JSON.stringify({ to, sound: 'default', title, body, data });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(responseBody);
                } else {
                    reject(new Error(`Expo push API responded ${res.statusCode}: ${responseBody}`));
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
};

exports.addFollowerNotification = functions.firestore.document('/following/{userId}/userFollowing/{FollowingId}')
    .onCreate(async (snap, context) => {
        const followerId = context.params.userId;
        const followedId = context.params.FollowingId;

        try {
            const [followedDoc, followerDoc] = await Promise.all([
                db.collection('users').doc(followedId).get(),
                db.collection('users').doc(followerId).get()
            ]);

            if (!followedDoc.exists || !followerDoc.exists) {
                console.log(`addFollowerNotification: user document missing (followed: ${followedDoc.exists}, follower: ${followerDoc.exists})`);
                return null;
            }

            const token = followedDoc.data().notificationToken;
            if (!token) {
                console.log(`addFollowerNotification: user ${followedId} has no notification token`);
                return null;
            }

            const followerName = followerDoc.data().name;
            await sendPushNotification(
                token,
                'New Follower',
                `${followerName} Started following you`,
                { type: 'profile', user: followerId }
            );
            console.log(`addFollowerNotification: notified ${followedId} about new follower ${followerId}`);
            return null;
        } catch (error) {
            console.error('addFollowerNotification failed', error);
            return null;
        }
    })

exports.addLikeNotification = functions.firestore.document('/posts/{creatorId}/userPosts/{postId}/likes/{userId}')
    .onCreate(async (snap, context) => {
        const likerId = context.params.userId;
        const creatorId = context.params.creatorId;

        if (likerId === creatorId) {
            return null;
        }

        try {
            const [creatorDoc, likerDoc] = await Promise.all([
                db.collection('users').doc(creatorId).get(),
                db.collection('users').doc(likerId).get()
            ]);

            if (!creatorDoc.exists || !likerDoc.exists) {
                console.log(`addLikeNotification: user document missing (creator: ${creatorDoc.exists}, liker: ${likerDoc.exists})`);
                return null;
            }

            const token = creatorDoc.data().notificationToken;
            if (!token) {
                console.log(`addLikeNotification: user ${creatorId} has no notification token`);
                return null;
            }

            const likerName = likerDoc.data().name;
            await sendPushNotification(
                token,
                'New Like',
                `${likerName} liked your post`,
                { type: 0, postId: context.params.postId, user: likerId }
            );
            console.log(`addLikeNotification: notified ${creatorId} about like from ${likerId} on post ${context.params.postId}`);
            return null;
        } catch (error) {
            console.error('addLikeNotification failed', error);
            return null;
        }
    })

exports.addCommentNotification = functions.firestore.document('/posts/{creatorId}/userPosts/{postId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const commenterId = snap.data().creator;
        const creatorId = context.params.creatorId;

        if (!commenterId || commenterId === creatorId) {
            return null;
        }

        try {
            const [creatorDoc, commenterDoc] = await Promise.all([
                db.collection('users').doc(creatorId).get(),
                db.collection('users').doc(commenterId).get()
            ]);

            if (!creatorDoc.exists || !commenterDoc.exists) {
                console.log(`addCommentNotification: user document missing (creator: ${creatorDoc.exists}, commenter: ${commenterDoc.exists})`);
                return null;
            }

            const token = creatorDoc.data().notificationToken;
            if (!token) {
                console.log(`addCommentNotification: user ${creatorId} has no notification token`);
                return null;
            }

            const commenterName = commenterDoc.data().name;
            await sendPushNotification(
                token,
                'New Comment',
                `${commenterName} Commented on your post`,
                { type: 0, user: commenterId }
            );
            console.log(`addCommentNotification: notified ${creatorId} about comment from ${commenterId} on post ${context.params.postId}`);
            return null;
        } catch (error) {
            console.error('addCommentNotification failed', error);
            return null;
        }
    })

exports.removeFollower = functions.firestore.document('/following/{userId}/userFollowing/{FollowingId}')
    .onDelete((snap, context) => {
        return db
            .collection('users')
            .doc(context.params.FollowingId)
            .update({
                followersCount: admin.firestore.FieldValue.increment(-1)
            }).then(() => {
                return db
                    .collection('users')
                    .doc(context.params.userId)
                    .update({
                        followingCount: admin.firestore.FieldValue.increment(-1)
                    })
            })
    })

exports.addComment = functions.firestore.document('/posts/{creatorId}/userPosts/{postId}/comments/{userId}')
    .onCreate((snap, context) => {
        return db
            .collection("posts")
            .doc(context.params.creatorId)
            .collection("userPosts")
            .doc(context.params.postId)
            .update({
                commentsCount: admin.firestore.FieldValue.increment(1)
            })
    })
