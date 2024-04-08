/**
 * API documentation
 */

// Authentication
const authAPI = "api/auth/"; // static method
const loginAPI = "api/auth/login/"; // static method
const signinAPI = "api/auth/signup/"; // static method
const googleAPI = "api/auth/google_auth/"; // static method
const forty2API = "api/auth/forty2_auth/"; // static method
const isRegisteredAPI = "api/auth/is_registered/"; // static method

// User management
const meAPI = "api/user_management/me"; // static method
const userIdAPI = "api/user_management/user/id/" // dynamic method -> add user_id
const userViewAPI = "api/user_management/user/"; // dynamic method -> add user_id from window.location.pathname.split('/')[2]
const editProfileAPI = "api/user_management/edit_profile"; // static method
const addFriendAPI = "/api/user_management/add_friend/"; // dynamic method -> add user_id
const friendshipStatusAPI = "/api/user_management/friends/"; // dynamic method -> add user_id

// Notoifications
const setSeenNotifsAPI = "api/notif/set_seen"; // static method
const getAllNotifsAPI = "api/notif/get_notifs/all"; // static method
const getUnseenNotifsAPI = "api/notif/get_notifs/unseen"; // static method
const friendRequestNotifAPI = "api/notif/create_notif/friend_request/"; // dynamic method -> add user_id
const friendRemovalNotifAPI = "api/notif/create_notif/friend_removal/"; // dynamic method -> add user_id

// Rooms
const createRoomAPI = "api/rooms/create_room"; // static method
const getRoomStatusAPI = "api/rooms/code/"; // dynamic method -> add room_code
const getRoomInfoAPI = "api/rooms/info/"; // dynamic method -> add room_code

// Game
const startGameAPI = "api/game/start/"; // dynamic method -> add room_id

