# Generated by Django 5.0.3 on 2024-04-10 10:56

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0002_alter_occupy_player_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_rounds', models.IntegerField()),
                ('current_round', models.IntegerField()),
                ('room_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='rooms.rooms')),
            ],
        ),
        migrations.CreateModel(
            name='Round',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_number', models.IntegerField()),
                ('Tournament_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='rooms.tournament')),
            ],
        ),
    ]
