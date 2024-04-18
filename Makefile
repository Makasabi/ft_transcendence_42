run: down
	docker-compose -f docker-compose.yml up -d --build
	nohup docker-compose -f docker-compose.yml logs -f > logs.log 2>&1 &

logs:
	docker-compose -f docker-compose.yml logs

down:
	docker-compose -f docker-compose.yml down
