import pygame

# Initialize the game
# Starting Pong game

pygame.init()
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)

font20 = pygame.font.Font('freesansbold.ttf', 20)
WIDTH, HEIGHT = 600, 800
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Pong")
clock = pygame.time.Clock()
FPS = 30

class Player:
	def __init__(self, posx, posy, width, height, speed, color):
		self.posx = posx
		self.posy = posy
		self.width = width
		self.height = height
		self.speed = speed
		self.color = color
		self.player = pygame.Rect(posx, posy, width, height)
		#self.geek = pygame.draw.rect(screen, self.color, self.player)
		pygame.draw.rect(screen, self.color, self.player)

	# Used to display the object on the screen
	def display(self):
		pygame.draw.rect(screen, self.color, self.player)

	# Used to update the state of the object
	def update(self, xFac):
		self.posx = self.posx + self.speed*xFac

		if self.posx <= 0:
			self.posx = 0
		elif self.posx + self.width >= WIDTH:
			self.posx = WIDTH-self.width

		# Updating the rect with the new values
		self.player = (self.posx, self.posy, self.width, self.height)

	def displayScore(self, text, score, x, y, color):
		text = font20.render(text+str(score), True, color)
		textRect = text.get_rect()
		textRect.center = (x, y)
		screen.blit(text, textRect)

	def getRect(self):
		return self.player

class Ball:
	def __init__(self, posx, posy, radius, speed, color):
		self.posx = posx
		self.posy = posy
		self.radius = radius
		self.speed = speed
		self.color = color
		self.xFac = -1
		self.yFac = 1
		self.ball = pygame.draw.circle(screen, self.color, (self.posx, self.posy), self.radius)
		self.firstTime = 1

	def display(self):
		self.ball = pygame.draw.circle(screen, self.color, (self.posx, self.posy), self.radius)

	def update(self):
		self.posx += self.speed*self.xFac
		self.posy += self.speed*self.yFac

		# If the ball hits the top or bottom surfaces,
		# then the sign of yFac is changed and it
		# results in a reflection
		if self.posx <= 0 or self.posx >= WIDTH:
			self.xFac *= -1

		# If the ball touches the left wall for the first time,
		# The firstTime is set to 0 and we return 1
		# indicating that Geek2 has scored
		# firstTime is set to 0 so that the condition is
		# met only once and we can avoid giving multiple
		# points to the player
		if self.posy <= 0 and self.firstTime:
			self.firstTime = 0
			return 1
		elif self.posy >= HEIGHT and self.firstTime:
			self.firstTime = 0
			return -1
		else:
			return 0

	# Used to reset the position of the ball
	# to the center of the screen
	def reset(self):
		self.posx = WIDTH//2
		self.posy = HEIGHT//2
		self.xFac *= -1
		self.firstTime = 1

	# Used to reflect the ball along the X-axis
	def hit(self):
		self.yFac *= -1

	def getRect(self):
		return self.ball

def main():
	running = True

	player1 = Player(0, 20, 100, 20, 10, GREEN)
	player2 = Player(20, HEIGHT - 20, 100, 20, 10, GREEN)
	ball = Ball(WIDTH//2, HEIGHT//2, 7, 7, WHITE)

	players = [player1, player2]

	# Initial parameters of the players
	player1Score, player2Score = 0, 0
	player1XFac, player2XFac = 0, 0

	while running:
		screen.fill(BLACK)

		# Event handling
		for event in pygame.event.get():
			if event.type == pygame.QUIT:
				running = False
			if event.type == pygame.KEYDOWN:
				if event.key == pygame.K_LEFT:
					player2XFac = -1
				if event.key == pygame.K_RIGHT:
					player2XFac = 1
				if event.key == pygame.K_a:
					player1XFac = -1
				if event.key == pygame.K_d:
					player1XFac = 1
			if event.type == pygame.KEYUP:
				if event.key == pygame.K_LEFT or event.key == pygame.K_RIGHT:
					player2XFac = 0
				if event.key == pygame.K_a or event.key == pygame.K_d:
					player1XFac = 0

		# Collision detection
		for player in players:
			if pygame.Rect.colliderect(ball.getRect(), player.getRect()):
				ball.hit()

		# Updating the objects
		player1.update(player1XFac)
		player2.update(player2XFac)
		point = ball.update()

		# -1 -> Geek_1 has scored
		# +1 -> Geek_2 has scored
		#  0 -> None of them scored
		if point == -1:
			player1Score += 1
		elif point == 1:
			player2Score += 1

		if point:   # Someone has scored a point and the
		# ball is out of bounds. So, we reset it's position
			ball.reset()

		# Displaying the objects on the screen
		player1.display()
		player2.display()
		ball.display()

		# Displaying the scores of the players
		player1.displayScore("Geek_1 : ", player1Score, 100, 20, WHITE)
		player2.displayScore("Geek_2 : ", player2Score, WIDTH-100, 20, WHITE)

		pygame.display.update()
		# Adjusting the frame rate
		clock.tick(FPS)

if __name__ == "__main__":
	main()
	pygame.quit()
	quit()