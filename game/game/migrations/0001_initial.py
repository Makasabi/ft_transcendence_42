# Generated by Django 5.0.3 on 2024-04-17 18:28

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('game_id', models.AutoField(primary_key=True, serialize=False)),
                ('parent_id', models.IntegerField(default=-1)),
                ('mode', models.CharField(default='Normal', max_length=50)),
                ('visibility', models.CharField(default='Public', max_length=50)),
                ('date_begin', models.DateField(default=django.utils.timezone.now)),
                ('date_end', models.DateField(null=True)),
                ('end_status', models.CharField(max_length=50, null=True)),
                ('ongoing', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Play',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_id', models.IntegerField(default=0)),
                ('score', models.IntegerField(default=-1)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='game.game')),
            ],
            options={
                'unique_together': {('game', 'user_id')},
            },
        ),
    ]