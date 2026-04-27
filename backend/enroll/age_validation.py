"""
Age validation for event enrollment.
Parses event level (e.g. "Under 14", "Under 20") and validates player ages as of event date.
"""
import re
from datetime import date, datetime


def parse_max_age_from_level(level):
    """
    Parse event level string to get max allowed age (inclusive).
    "Under 14" -> max age 13 (player must be 13 or younger on event date)
    "Under 20" -> max age 19
    Returns None if no age limit (Open, etc.)
    """
    if not level or not isinstance(level, str):
        return None
    level_lower = level.strip().lower()
    if level_lower in ('open', 'all', 'all levels', ''):
        return None
    # Match: "Under 14", "Under-14", "U14", "U 14", "14U", etc.
    match = re.search(r'under\s*[-\s]*(\d+)|u\s*[-\s]*(\d+)|(\d+)\s*u', level_lower)
    if match:
        n = int(match.group(1) or match.group(2) or match.group(3))
        return n - 1 if n > 0 else None
    return None


def get_age_as_of(dob, as_of_date):
    """Calculate age in years as of a given date."""
    if not dob:
        return None
    if isinstance(dob, str):
        from datetime import datetime
        try:
            dob = datetime.strptime(dob[:10], '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return None
    age = as_of_date.year - dob.year - ((as_of_date.month, as_of_date.day) < (dob.month, dob.day))
    return age


def validate_players_age_for_event(players_data, event, event_date=None):
    """
    Validate that all players are within the event's age limit.
    Returns (is_valid, error_message).
    error_message lists over-age players: "Player X (age 15) exceeds age limit (Under 14)"
    """
    max_age = parse_max_age_from_level(event.level)
    if max_age is None:
        return True, None

    as_of = event_date or (getattr(event, 'date', None) or date.today())
    if isinstance(as_of, datetime):
        as_of = as_of.date()

    over_age = []
    for p in players_data or []:
        dob = p.get('dob')
        if not dob:
            continue
        age = get_age_as_of(dob, as_of)
        if age is not None and age > max_age:
            name = p.get('player_name', 'Unknown')
            over_age.append(f"{name} (age {age})")

    if over_age:
        limit_label = event.level if hasattr(event, 'level') else f"Under {max_age + 1}"
        return False, (
            f"The following player(s) exceed the age limit for this event ({limit_label}): "
            + ", ".join(over_age)
        )
    return True, None
