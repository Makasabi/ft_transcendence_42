/**
 * API documentation
 */

// Authentication
const authAPI = "/api/auth/"; // static method
const loginAPI = "/api/auth/login/"; // static method
const signinAPI = "/api/auth/signup/"; // static method
const googleAPI = "/api/auth/google_auth/"; // static method
const forty2API = "/api/auth/forty2_auth/"; // static method
const isRegisteredAPI = "/api/auth/is_registered/"; // static method


// User management
const meAPI = "/api/user_management/me"; // static method
const meUsernameAPI = "api/user_management/me_username"; // static method
const userIdAPI = "/api/user_management/user/id/" // dynamic method -> add user_id
const userUsernameAPI = "/api/user_management/user/username/" // dynamic method -> add user_id
const userSearchAPI = "/api/user_management/search/"; // dynamic method -> add search_query
const editProfileAPI = "/api/user_management/edit_profile"; // static method
const avatarUploadAPI = "/api/user_management/upload_avatar"; // static method
const getFriendsAPI = "/api/user_management/get_friends"; // static method
const getOnlineStatusAPI = "/api/user_management/get_online_status/"; // dynamic method -> add username
const friendshipStatusAPI = "/api/user_management/friends/"; // dynamic method -> add user_id
const addFriendAPI = "/api/user_management/add_friend/"; // dynamic method -> add user_id
const removeFriendAPI = "/api/user_management/remove_friend/"; // dynamic method -> add user_id
const searchUsersAPI = "/api/user_management/user/search/"; // dynamic method -> add search_query
const findMatchAPI = "/api/user_management/find_match/"; // dynamic method -> add username


// Notifications
const setSeenNotifsAPI = "/api/notif/set_seen"; // static method
const getAllNotifsAPI = "/api/notif/get_notifs/all"; // static method
const getUnseenNotifsAPI = "/api/notif/get_notifs/unseen"; // static method
const friendRequestNotifAPI = "/api/notif/create_notif/friend_request/"; // dynamic method -> add user_id
const friendRemovalNotifAPI = "/api/notif/create_notif/friend_removal/"; // dynamic method -> add user_id

// Rooms
const createRoomAPI = "/api/rooms/create_room"; // static method
const getRoomStatusAPI = "/api/rooms/code/"; // dynamic method -> add room_code
const getRoomInfoAPI = "/api/rooms/info/"; // dynamic method -> add room_code

// Game
const startGameAPI = "/api/game/start/"; // dynamic method -> add room_id

