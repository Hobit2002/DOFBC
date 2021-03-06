# Generated by Django 3.0.5 on 2021-11-21 15:22

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('UI', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='feedback',
            name='area',
        ),
        migrations.AddField(
            model_name='feedback',
            name='form',
            field=models.OneToOneField(default=None, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='UI.Form'),
        ),
        migrations.AddField(
            model_name='feedback',
            name='jsonAnswers',
            field=models.TextField(default='{}', max_length=1000),
        ),
        migrations.AddField(
            model_name='feedback',
            name='user',
            field=models.OneToOneField(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='form',
            name='jsonQuestions',
            field=models.TextField(default='{}', max_length=1000),
        ),
        migrations.DeleteModel(
            name='appUser',
        ),
        migrations.DeleteModel(
            name='Area',
        ),
    ]
