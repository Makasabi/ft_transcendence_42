# Generated by Django 5.0.3 on 2024-04-15 18:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='ongoing',
            field=models.BooleanField(default=False),
        ),
    ]