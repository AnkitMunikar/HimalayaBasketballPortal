# Generated manually: end_date + EventTeamStanding

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0004_merge_20251105_1611'),
        ('enroll', '0007_alter_payment_enrollment_alter_payment_pidx'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='end_date',
            field=models.DateField(blank=True, help_text='Optional. Leave blank for single-day events.', null=True),
        ),
        migrations.CreateModel(
            name='EventTeamStanding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('wins', models.PositiveIntegerField(default=0)),
                ('losses', models.PositiveIntegerField(default=0)),
                ('points_for', models.PositiveIntegerField(default=0)),
                ('points_against', models.PositiveIntegerField(default=0)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='standings', to='events.event')),
                ('team_enrollment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='event_standings', to='enroll.teamenroll')),
            ],
            options={
                'ordering': ['event', '-wins', '-points_for'],
                'unique_together': {('event', 'team_enrollment')},
            },
        ),
    ]
