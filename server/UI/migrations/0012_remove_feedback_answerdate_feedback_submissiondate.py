# Generated by Django 4.0.1 on 2022-02-04 14:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('UI', '0011_remove_feedback_submissiondate_feedback_answerdate'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='feedback',
            name='answerDate',
        ),
        migrations.AddField(
            model_name='feedback',
            name='submissionDate',
            field=models.DateTimeField(auto_now_add=True, default='2022-02-04'),
            preserve_default=False,
        ),
    ]
