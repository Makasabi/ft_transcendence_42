import { IView } from "/front/pages/IView.js";
import { route } from "/front/pages/spa_router.js";

export class LoggedHeaderView extends IView {
	static async render() {
		fetch("/front/pages/home/header.html")
			.then(response => response.text())
			.then(html => document.querySelector("header").innerHTML = html);
	}
}

export class HomeView extends IView {
	static match_route(route) {
		return route === "/home";
	}

	static async render() {
		await fetch("/front/pages/home/home.html")
			.then(response => response.text())
			.then(html => document.querySelector("main").innerHTML = html);

		document.querySelector(".centered_box").addEventListener("click", (e) => {
			switch (e.target.id)
			{
				case "game":
					route("/game");
					break;
				case "join":
					route("/join");
					break;
				case "create":
					createRoomMode();
					break;
				case "me":
					route("/me");
					break;
			}
		});
	}

	static destroy() {
	}
}

function createRoomMode()
{
	let element = document.querySelector(".createRoomSelect");
	if (element.classList.contains("show")) {
		element.classList.remove('show');
	} else {
		element.classList.add('show');
	}
	let createRoom = document.querySelectorAll(".createRoomMode input");
	let selectedMode = "/create/normal";
	for (let index = 0; index < createRoom.length; index++) {
		createRoom[index].addEventListener("change", (event) => {
			if (event.target.value === "1") {
				selectedMode = "/create/normal";
			} else if (event.target.value === "2") {
				selectedMode = "/create/tournament";
			}
		});
	}
	let createRoomCTA = document.getElementById("createRoomCTA");
	createRoomCTA.addEventListener("click", () => {
		route(selectedMode);
	});
}

export async function footer()
{
	return await fetch("/front/pages/home/footer.html").then(response => response.text());
}


/*
    let listeBtnRadio = document.querySelectorAll(".optionSource input")
for (let index = 0; index < listeBtnRadio.length; index++) {
        listeBtnRadio[index].addEventListener("change", (event) => {
            // Si c'est le premier élément qui a été modifié, alors nous voulons
            // jouer avec la listeMots.
            if (event.target.value === "1") {
                listeProposition = listeMots
            } else {
                // Sinon nous voulons jouer avec la liste des phrases
                listeProposition = listePhrases
            }
            // Et on modifie l'affichage en direct.
            afficherProposition(listeProposition[i])
        })
    }*/