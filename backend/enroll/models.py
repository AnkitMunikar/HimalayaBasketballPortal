from django.db import models

class TeamEnroll(models.Model):
    GENDER_CHOICES =[
        ('Boys', 'Boys'),
        ('Girls', 'Girls'),
        ('Boys and Girls', 'Boys and Girls'),
    ]
    

    team_name = models.CharField(max_length=100, verbose_name="Team Name")
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        default='Boys'
    )
    coach_name = models.CharField(max_length=100, verbose_name="Coach Name")
    contact_number = models.CharField(max_length=15, verbose_name="Contact Number")
    email = models.EmailField(verbose_name="Email Address")
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='enrollments')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team_name}"


class Player(models.Model):
    POSITION_CHOICES = [
        ('PG', 'Point Guard'),
        ('SG', 'Shooting Guard'),
        ('SF', 'Small Forward'),
        ('PF', 'Power Forward'),
        ('C', 'Center'),
    ]
    teamenroll = models.ForeignKey(TeamEnroll, related_name='players', on_delete=models.CASCADE)
    player_name = models.CharField(max_length=100)
    age = models.IntegerField()
    position = models.CharField(max_length=2, choices=POSITION_CHOICES, blank=True, null=True)
    grade = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player_name} "
