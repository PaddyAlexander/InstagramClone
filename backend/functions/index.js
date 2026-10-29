const functions = require('firebase-functions');

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

exports.addBookmark = functions.firestore.document('/bookmarks/{userId}/userBookmarks/{bookmarkId}')
    .onCreate((snap, context) => {
        const bookmarkData = snap.data();
        const postId = bookmarkData.postId;
        const creatorId = bookmarkData.userId;

        return db
            .collection("posts")
            .doc(creatorId)
            .collection("userPosts")
            .doc(postId)
            .update({
                bookmarkCount: admin.firestore.FieldValue.increment(1)
            })
    });

exports.removeBookmark = functions.firestore.document('/bookmarks/{userId}/userBookmarks/{bookmarkId}')
    .onDelete((snap, context) => {
        const bookmarkData = snap.data();
        const postId = bookmarkData.postId;
        const creatorId = bookmarkData.userId;

        return db
            .collection('posts')
            .doc(creatorId)
            .collection('userPosts')
            .doc(postId)
            .update({
                bookmarkCount: admin.firestore.FieldValue.increment(-1)
            })
    })

