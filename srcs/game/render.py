import pygame
from .game import Ball, Player

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