# Generated by Django 5.0.3 on 2024-04-08 14:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0002_rename_date_game_date_begin_remove_game_mode_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='mode',
            field=models.CharField(default='Normal', max_length=50),
        ),
        migrations.AddField(
            model_name='game',
            name='visibility',
            field=models.CharField(default='Public', max_length=50),
        ),
    ]
