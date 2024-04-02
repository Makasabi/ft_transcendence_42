import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RPSConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("Scope : ", self.scope)
        self.group_name = 'players'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        self.accept()
        self.send(text_data=json.dumps({"message" : "All good"}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, data):
        data_json = json.loads(data)
        self.channel_layer.group_send(self.group_name, {'type' : 'rps.response', 'data' : data_json})

    async def rps_response(self, event):
        self.send(text_data=json.dumps(event))
