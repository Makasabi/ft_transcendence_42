# Generated by Django 5.0.3 on 2024-04-17 16:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0004_rename_doublefa_player_twofa'),
    ]

    operations = [
        migrations.AddField(
            model_name='player',
            name='valid_twoFA',
            field=models.BooleanField(default=False),
        ),
    ]