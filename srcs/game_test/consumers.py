import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

class RPSConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        print("SCOPE : ", self.scope)
        self.group_name = 'players'
        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)
        self.send(text_data=json.dumps({"message" : "All good"}))

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard(self.group_name, self.channel_name))

    def receive(self, text_data):
        data_json = json.loads(text_data)
        print("DATA RECEIVED : ", data_json)
        print("Group name : ", self.group_name)
        #self.send(text_data=json.dumps({"message" : "Prout"}))
        async_to_sync(self.channel_layer.group_send)(self.group_name, {"type": "rps_response", "data": data_json})
        print("Over")

    def rps_response(self, event):
        print(' Entered rps_response')
        self.send(text_data=json.dumps({"message" : event["data"]}))
