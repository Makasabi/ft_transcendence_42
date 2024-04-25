import * as Login from '../login/login.js';


/**
 * Creates and starts a local game with the specified player names.
 * @param {string} player2_name - The name of player 2.
 * @param {string|null} player1_name - The name of player 1 (optional, defaults to null).
 * @returns {Promise<string|undefined>} - A promise that resolves to the game ID if the game is successfully created, or undefined if there was an error.
 */
export async function createLocalGame(player2_name, player1_name = null) {
	console.log("Starting Local game with players ", player1_name, " and ", player2_name);
	return await fetch(`/api/game/create_local`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Token ${Login.getCookie('token')}`,
		},
		body: JSON.stringify({
			"player2_name": player2_name,
			"player1_name": player1_name
		})
	}).then(async response => {
		if (response.status === 200) {
			const data = await response.json();
			const game_id = data.game_id;
			if (game_id === undefined) {
				console.error("Error starting game: game_id is undefined");
				return;
			}
			return game_id;
		}
		console.error("Error starting game:", response.status);
		const data = await response.json();
		console.error(data);
	})
}

/**
 * Fetches the local game results from the server.
 * @param {string} game_id - The ID of the game.
 * @returns {Promise<Object>} - A promise that resolves to the game results data.
 */
export async function getLocalResults(game_id) {
	return await fetch(`/api/game/local_winner/${game_id}`, {
		method: "GET",
		headers: {
			'Authorization': `Token ${Login.getCookie('token')}`,
		}
	}).then(async response => {
		if (response.status === 200) {
			const data = await response.json();
			return data;
		}
		console.error("Error getting local results:", response.status);
		const data = await response.json();
		console.error(data);
	})
}
