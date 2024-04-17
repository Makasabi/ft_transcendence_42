import * as Login from "/front/pages/login/login.js";
import { IView } from "/front/pages/IView.js";
import { errorMessage } from "/front/pages/room/roomUtils.js";
import { route } from "/front/pages/spa_router.js"


/**
 * send a POST request to back to create the tournament record in DB
 * once created, send a websocket message to all players in the room to start the tournament
 * @param {*} roomSocket
 * @param {*} room_id
 * @param {*} roomCode
 */
export async function createTournament(roomSocket, room_id, roomCode) {
	let tournament = await fetch (`/api/rooms/create_tournament/${room_id}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`},
		body: JSON.stringify({
			"room_id": room_id,
			"room_code": roomCode,
		}),
	}).then(async response => {
		if (response.status === 200) {
			const data = await response.json();
			console.log("data:", data);
			if (data.occupancy < 8) {
				console.error("Not enough players to start tournament");
				errorMessage("You need at least 8 players to start a tournament.");
				response.status === 400;
				return;
			}
			console.log("Tournament created:", data);

			// let roundInfo = await fetch(`/api/rooms/create_round/${data.id}/${data.current_round}`, {
			// 	method: "POST",
			// 	headers: {
			// 		'Authorization': `Token ${Login.getCookie('token')}`,
			// 	}
			// }).then(response => response.json());
			// console.log(`Round ${data.current_round} created: `, roundInfo);

			const to_send = JSON.stringify({
				"type": "tournament_start",
				"message": "Tournament starting",
				"room_id": room_id,
				"room_code": roomCode,
			})
			console.log("Sending message to start tournament:", to_send);
			roomSocket.send(to_send);
		} else {
			console.error("Error creating tournament");
		}
	})
}

export async function getRoomInfo(code) {
	let roomInfo = await fetch(`/api/rooms/info/${code}`, {
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`,
		}}).then(response => response.json());
	console.log("room:", roomInfo);
	// redirect user to uninvited if roomInfo Allowed is false
	if (roomInfo.allowed === false) {
		console.error("User not allowed in room");
		route("/uninvited");
		return;
	}
	return roomInfo;
}

export async function getTournamentInfo(room_id) {
	let tournament = await fetch(`/api/rooms/info_tournament/${room_id}`, {
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`,
		}
		}).then((response) => {
			console.log("response:", response);
			if (!response.ok) {
				console.error("Error fetching tournament info:", response);
				return;
			}
			const res = response.json();
			console.log("res:", res);
			return res;
		});
	console.log("tournament:", tournament);
	return tournament;
}

export async function getRoundInfo(tournament_id, round_number) {
	let roundInfo = await fetch(`/api/rooms/info_round/${tournament_id}/${round_number}`, {
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`,
		}
	}).then(response => response.json());
	// console.log("roundInfo:", roundInfo);
	return roundInfo;
}

export function fillRoundMap(tournament, pools){
	let round_map = document.getElementById("round_map");
	let round_header = document.getElementById("round_headers");

	for (let i = 1; i <= tournament.total_rounds; i++) {
		let round = document.createElement("div");
		let header = document.createElement("h3");
		header.innerHTML = `${i}`;
		header.classList.add("header");
		round.classList.add("round");
		round.id = `round${i}`;
		if (i === tournament.current_round) {
			round.classList.add("current_round");
			header.style.color = "var(--contrast)"
		}
		if (i === 1) {
			for (let j = 1; j <= Object.keys(pools).length; j++) {
				let pool = document.createElement("img");
				pool.src = "/front/ressources/img/svg/hexagon.svg";
				pool.id = `pool${j}`;
				round.appendChild(pool);
			}
		}
		else {
			let nu_pools = tournament.total_rounds - i + 1;
			for (let j = 1; j <= nu_pools; j++) {
				let pool = document.createElement("img");
				pool.src = "/front/ressources/img/svg/hexagon.svg";
				pool.id = `pool${j}`;
				round.appendChild(pool);
			}
		}
		round_header.appendChild(header);
		round_map.appendChild(round);
	}
}

export function renamePools(pools) {
	const poolNames = Object.keys(pools);
	const numberedPools = poolNames.reduce((acc, poolName, index) => {
		const newPoolName = `pool${index + 1}`; // Generate new pool name with a number
		acc[newPoolName] = pools[poolName]; // Assign original pool data to new pool name
		return acc;
	}, {});
	pools = numberedPools;
	// console.log(pools);
	return pools;
}

async function findPoolByUserId(pools) {
	let me = await fetch(`/api/user_management/me_id`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
	}).then(response => response.json());

	for (const poolName in pools) {
		if (pools.hasOwnProperty(poolName)) {
			const pool = pools[poolName];
			const players = pool.players;
			const foundPlayer = players.find(player => player.id === me.id);
			if (foundPlayer) {
				return poolName;
			}
		}
	}
	return null;
}

export async function APool(pools, pool_number) {

	let header = document.getElementById("pool_header");
	header.innerHTML = `Pool ${pool_number.split("pool")[1]}`;

	const playersInPool = pools[pool_number].players;

	for (let i = 0; i < 6; i++) {
		let playerSlot = document.getElementById(`P${i}`);
		if (playerSlot !== null) {
			playerSlot.innerHTML = "";
		}
		let username = document.createElement("p");
		let userimg = document.createElement("img");
		const player = playersInPool[i];
		if (player) {
			username.innerHTML = player.username;
			userimg.src = player.avatar_file;
		}
		else if (!player || player === undefined) {
			username.innerHTML = "No player";
			userimg.src = "/front/ressources/img/svg/hexagon.svg";
			userimg.style.filter = "opacity(0%)";
		}
		playerSlot.appendChild(userimg);
		playerSlot.appendChild(username);
	}
}

export async function displayAPool(pools) {

	let current_round = document.querySelector(".current_round");
	current_round.addEventListener("click", (e) => {
		let pool = e.target.id;
		if (pool === "undefined") {
			return;
		}
		let pool_number = pool.split("pool")[1];
		if (pool_number === undefined) {
			return;
		}
		APool(pools, pool);
	});
}

export async function displayMyPool(pools) {

	let myPool = await findPoolByUserId(pools);

	let myPoolImg = document.getElementById(myPool);
	myPoolImg.style.filter = "opacity(100%) invert(40%) sepia(73%) saturate(1183%) hue-rotate(218deg) brightness(104%) contrast(101%)";

	APool(pools, myPool);
}

export async function getRoundStartTime(tournament_id, round_number) {
	let start_time = await fetch(`/api/rooms/round_start_time/${tournament_id}/${round_number}`, {
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`,
		}
	}).then(response => response.json());
	// console.log("start_time:", start_time);
	return start_time.start_time;
}