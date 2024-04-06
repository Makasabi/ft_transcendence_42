from constants import PLAYER_LENGTH, CENTER_X, CENTER_Y
from Player import Player
import math

cosPiSur3 = math.cos(math.pi / 3)
sinPiSur3 = math.sin(math.pi / 3)

hexagon_vertices = [
	(1, 0),
	(cosPiSur3, sinPiSur3),
	(-cosPiSur3, sinPiSur3),
	(-1, 0),
	(-cosPiSur3, -sinPiSur3),
	(cosPiSur3, -sinPiSur3),
]

def get_hexagon_borders(radius) -> None:
	arena_vertices = [(radius * x + CENTER_X, radius * y + CENTER_Y) for x, y in hexagon_vertices]

	borders = [
		[
			arena_vertices[0],
			arena_vertices[1],
		],
		[
			arena_vertices[1],
			arena_vertices[2],
		],
		[
			arena_vertices[2],
			arena_vertices[3],
		],
		[
			arena_vertices[3],
			arena_vertices[4],
		],
		[
			arena_vertices[4],
			arena_vertices[5],
		],
		[
			arena_vertices[5],
			arena_vertices[0],
		],
	]
	return  borders

def get_hexagon_pilars(arena_radius) -> None:
	pilars = []
	arena_vertices = [(arena_radius * x, arena_radius * y) for x, y in hexagon_vertices]
	radius = arena_radius * 0.05

	for center in arena_vertices:
		pilars.append([(x * radius + center[0] + CENTER_X, y * radius + center[1] + CENTER_Y) for x, y in hexagon_vertices])
	return pilars

def get_players_arrangement(player_count):
	if player_count == 1:
		raise ValueError("Player count must be greater than 1")
	if player_count == 2:
		return (-1, 0, -1, -1, 1, -1)
	if player_count == 3:
		return (-1, 0, -1, 1, -1, 2)
	if player_count == 4:
		return (0, -1, 1, 2, -1, 3)
	if player_count == 5:
		return (-1, 0, 1, 2, 3, 4)
	if player_count == 6:
		return (5, 0, 1, 2, 3, 4)
	raise ValueError("Player count must be less than 7")

def create_player(player_id, border) -> Player:
	"""
	Create a player object with the given id and border
	params:
		player_id: int
		border: [(float, float), (float, float)]
	returns:
		Player
	"""

	# Calculate the position based on the wall coordinates
	x1, y1 = border[0]
	x2, y2 = border[1]
	x = (x1 + x2) // 2
	y = (y1 + y2) // 2
	angle = math.atan2(y2 - y1, x2 - x1) * 180 / math.pi
	# posistions = middle of border + half of the player length
	offset_x = (PLAYER_LENGTH / 2) * math.cos(math.radians(angle))
	offset_y = (PLAYER_LENGTH / 2) * math.sin(math.radians(angle))
	# Calculate positions for left and right sides
	left_position = (x - offset_x, y - offset_y)
	right_position = (x + offset_x, y + offset_y)
	print("positions : ", left_position, right_position)
	print("angle : ", angle)
	positions = [left_position, right_position]
	return Player(player_id, positions, border, angle)
