import { FontAwesome5 } from '@expo/vector-icons';
import firebase from 'firebase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { sendNotification } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import CachedImage from '../random/CachedImage';
require('firebase/firestore')



function Profile(props) {
    const [userPosts, setUserPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false)
    const [activeTab, setActiveTab] = useState('posts')

    useEffect(() => {
        const { currentUser, posts } = props;

        if (props.route.params.uid === firebase.auth().currentUser.uid) {
            setUser(currentUser)
            setUserPosts(posts)
            setLoading(false)
            
            // Fetch saved posts for current user
            firebase.firestore()
                .collection("bookmarks")
                .doc(firebase.auth().currentUser.uid)
                .collection("userBookmarks")
                .orderBy("timestamp", "desc")
                .onSnapshot((snapshot) => {
                    let bookmarks = snapshot.docs.map(doc => {
                        const data = doc.data();
                        const id = doc.id;
                        return { id, ...data }
                    })
                    setSavedPosts(bookmarks)
                })
        }
        else {
            firebase.firestore()
                .collection("users")
                .doc(props.route.params.uid)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        props.navigation.setOptions({
                            title: snapshot.data().username,
                        })

                        setUser({ uid: props.route.params.uid, ...snapshot.data() });
                    }
                    setLoading(false)

                })
            firebase.firestore()
                .collection("posts")
                .doc(props.route.params.uid)
                .collection("userPosts")
                .orderBy("creation", "desc")
                .get()
                .then((snapshot) => {
                    let posts = snapshot.docs.map(doc => {
                        const data = doc.data();
                        const id = doc.id;
                        return { id, ...data }
                    })
                    setUserPosts(posts)
                })
        }


        if (props.following.indexOf(props.route.params.uid) > -1) {
            setFollowing(true);
        } else {
            setFollowing(false);
        }

    }, [props.route.params.uid, props.following, props.currentUser, props.posts])

    const onFollow = () => {
        firebase.firestore()
            .collection("following")
            .doc(firebase.auth().currentUser.uid)
            .collection("userFollowing")
            .doc(props.route.params.uid)
            .set({})

        props.sendNotification(user.notificationToken, "New Follower", `${props.currentUser.name} Started following you`, { type: 'profile', user: firebase.auth().currentUser.uid })
    }
    const onUnfollow = () => {
        firebase.firestore()
            .collection("following")
            .doc(firebase.auth().currentUser.uid)
            .collection("userFollowing")
            .doc(props.route.params.uid)
            .delete()
    }

    if (loading) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <ActivityIndicator style={{ alignSelf: 'center', marginBottom: 20 }} size="large" color="#00ff00" />
                <Text style={[text.notAvailable]}>Loading</Text>
            </View>
        )
    }
    if (user === null) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="dizzy" size={40} color="black" />
                <Text style={[text.notAvailable]}>User Not Found</Text>
            </View>
        )
    }
    return (
        <ScrollView style={[container.container, utils.backgroundWhite]}>

            <View style={[container.profileInfo]}>

                <View style={[utils.noPadding, container.row]}>

                    {user.image == 'default' ?
                        (
                            <FontAwesome5
                                style={[utils.profileImageBig, utils.marginBottomSmall]}
                                name="user-circle" size={80} color="black" />
                        )
                        :
                        (
                            <Image
                                style={[utils.profileImageBig, utils.marginBottomSmall]}
                                source={{
                                    uri: user.image
                                }}
                            />
                        )
                    }

                    <View style={[container.container, container.horizontal, utils.justifyCenter, utils.padding10Sides]}>

                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{userPosts.length}</Text>
                            <Text style={[text.center]}>Posts</Text>
                        </View>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{user.followersCount}</Text>
                            <Text style={[text.center]}>Followers</Text>
                        </View>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{user.followingCount}</Text>
                            <Text style={[text.center]}>Following</Text>
                        </View>
                    </View>

                </View>


                <View>
                    <Text style={text.bold}>{user.name}</Text>
                    <Text style={[text.profileDescription, utils.marginBottom]}>{user.description}</Text>

                    {props.route.params.uid !== firebase.auth().currentUser.uid ? (
                        <View style={[container.horizontal]}>
                            {following ? (
                                <TouchableOpacity
                                    style={[utils.buttonOutlined, container.container, utils.margin15Right]}
                                    title="Following"
                                    onPress={() => onUnfollow()}>
                                    <Text style={[text.bold, text.center, text.green]}>Following</Text>
                                </TouchableOpacity>
                            )
                                :
                                (
                                    <TouchableOpacity
                                        style={[utils.buttonOutlined, container.container, utils.margin15Right]}
                                        title="Follow"
                                        onPress={() => onFollow()}>
                                        <Text style={[text.bold, text.center, { color: '#2196F3' }]}>Follow</Text>
                                    </TouchableOpacity>

                                )}

                            <TouchableOpacity
                                style={[utils.buttonOutlined, container.container]}
                                title="Follow"
                                onPress={() => props.navigation.navigate('Chat', { user })}>
                                <Text style={[text.bold, text.center]}>Message</Text>
                            </TouchableOpacity>
                        </View>
                    ) :
                        <TouchableOpacity
                            style={utils.buttonOutlined}
                            onPress={() => props.navigation.navigate('Edit')}>
                            <Text style={[text.bold, text.center]}>Edit Profile</Text>
                        </TouchableOpacity>}
                </View>
            </View>

            <View style={[utils.borderTopGray]}>
                {props.route.params.uid === firebase.auth().currentUser.uid ? (
                    <View style={[container.horizontal, { borderBottomWidth: 1, borderColor: 'lightgrey' }]}>
                        <TouchableOpacity
                            style={[{ flex: 1, paddingVertical: 15, borderBottomWidth: activeTab === 'posts' ? 2 : 0, borderBottomColor: activeTab === 'posts' ? 'black' : 'transparent' }]}
                            onPress={() => setActiveTab('posts')}>
                            <Text style={[text.center, text.bold]}>Posts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[{ flex: 1, paddingVertical: 15, borderBottomWidth: activeTab === 'saved' ? 2 : 0, borderBottomColor: activeTab === 'saved' ? 'black' : 'transparent' }]}
                            onPress={() => setActiveTab('saved')}>
                            <Text style={[text.center, text.bold]}>Saved</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <FlatList
                    numColumns={3}
                    horizontal={false}
                    data={activeTab === 'posts' ? userPosts : savedPosts}
                    style={{}}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[container.containerImage, utils.borderWhite]}
                            onPress={() => {
                                if (activeTab === 'saved') {
                                    // For saved posts, we need to fetch the full post data
                                    props.navigation.navigate("Post", { item: item.postData, user: { uid: item.userId } })
                                } else {
                                    props.navigation.navigate("Post", { item, user })
                                }
                            }}>

                            {activeTab === 'saved' ? (
                                item.postData.type == 0 ?
                                    <CachedImage
                                        cacheKey={item.postData.id}
                                        style={container.image}
                                        source={{ uri: item.postData.downloadURLStill }}
                                    />
                                    :
                                    <CachedImage
                                        cacheKey={item.postData.id}
                                        style={container.image}
                                        source={{ uri: item.postData.downloadURL }}
                                    />
                            ) : (
                                item.type == 0 ?
                                    <CachedImage
                                        cacheKey={item.id}
                                        style={container.image}
                                        source={{ uri: item.downloadURLStill }}
                                    />
                                    :
                                    <CachedImage
                                        cacheKey={item.id}
                                        style={container.image}
                                        source={{ uri: item.downloadURL }}
                                    />
                            )}
                        </TouchableOpacity>

                    )}

                />
            </View>
        </ScrollView >

    )
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    posts: store.userState.posts,
    following: store.userState.following

})

const mapDispatchProps = (dispatch) => bindActionCreators({ sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Profile);

